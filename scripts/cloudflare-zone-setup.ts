#!/usr/bin/env bun
/**
 * Stage a domain on Cloudflare DNS without changing what it serves.
 *
 * The safest cutover is two steps, not one. This script does the first:
 * create the zone and replicate the CURRENT records exactly, so that flipping
 * nameservers is a **behavioural no-op** — the same answers from a different
 * server. Only afterwards, with rollback already proven, do the records change
 * to point at Workers.
 *
 * Doing it in one move couples two failures that are much easier to diagnose
 * apart: "the nameserver change broke resolution" and "the new origin is wrong".
 * With a 120s TTL on randsum.dev, the pause between them costs minutes.
 *
 * Written because `salvageunion.io` needs the identical sequence later. Clicking
 * through it twice is worse than writing it once, and a script records the
 * intent in a way a dashboard session does not.
 *
 * Plans by default. `--apply` is required to write anything.
 *
 *   CLOUDFLARE_API_TOKEN="$(cat ~/.cf-migration-token)" \
 *     bun scripts/cloudflare-zone-setup.ts randsum.dev
 *   CLOUDFLARE_API_TOKEN="$(cat ~/.cf-migration-token)" \
 *     bun scripts/cloudflare-zone-setup.ts randsum.dev --apply
 *
 * Needs a token with Zone:Edit and DNS:Edit. `wrangler login`'s OAuth token is
 * NOT sufficient — its scope set tops out at `zone (read)`, which is the whole
 * reason this needs a separate credential.
 */

const API = 'https://api.cloudflare.com/client/v4'

/** Public, not secret — it appears in every dashboard URL. */
const ACCOUNT_ID = 'f5f08e7e86ab8c183e381d4504bf8ba5'

/**
 * Names to replicate, per domain. Deliberately explicit rather than discovered:
 * a zone cannot be enumerated without AXFR, so anything not listed here is
 * invisible to this script. Diff against the DNS provider's dashboard before
 * trusting it — see apps/DEPLOY.md.
 */
const SUBDOMAINS: Readonly<Record<string, readonly string[]>> = {
  'randsum.dev': ['@', 'www', 'notation'],
  'salvageunion.io': ['@', 'www']
}

interface CloudflareResponse<T> {
  readonly success: boolean
  readonly errors: readonly { readonly code: number; readonly message: string }[]
  readonly result: T
}

function token(): string {
  const value = process.env['CLOUDFLARE_API_TOKEN']
  if (value === undefined || value.length === 0) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN is not set. Resolve it OUTSIDE this process:\n' +
        "  op read 'op://<vault>/CloudflareRandsumKey/credential' > ~/.cf-migration-token\n" +
        '  CLOUDFLARE_API_TOKEN="$(cat ~/.cf-migration-token)" bun scripts/cloudflare-zone-setup.ts <domain>\n' +
        '\n' +
        'Read into the env inline so the value is never printed. An agent session\n' +
        'cannot resolve it itself — `Bash(op:*)` is denied by design.'
    )
  }
  return value
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token()}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  })
  const body = (await response.json()) as CloudflareResponse<T>
  if (!body.success) {
    // Surface Cloudflare's own error text — its codes are specific and much more
    // useful than an HTTP status ("zone already exists" vs "insufficient scope"
    // are both 400s otherwise).
    throw new Error(body.errors.map(error => `[${error.code}] ${error.message}`).join('; '))
  }
  return body.result
}

/** Resolve a name's current A records from public DNS, via the authoritative servers. */
async function currentRecords(name: string): Promise<readonly string[]> {
  const proc = Bun.spawn(['dig', '+short', name, 'A'], { stdout: 'pipe', stderr: 'pipe' })
  await proc.exited
  return (await new Response(proc.stdout).text())
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^\d+\.\d+\.\d+\.\d+$/.test(line))
}

interface Zone {
  readonly id: string
  readonly name: string
  readonly status: string
  readonly name_servers?: readonly string[]
}

async function findOrCreateZone(domain: string, apply: boolean): Promise<Zone | undefined> {
  const existing = await api<readonly Zone[]>(`/zones?name=${encodeURIComponent(domain)}`)
  if (existing.length > 0) {
    console.log(`  zone: already exists (${existing[0]?.status})`)
    return existing[0]
  }

  if (!apply) {
    console.log('  zone: WOULD CREATE')
    return undefined
  }

  const zone = await api<Zone>('/zones', {
    method: 'POST',
    body: JSON.stringify({ name: domain, account: { id: ACCOUNT_ID }, jump_start: false })
  })
  console.log(`  zone: created (${zone.status})`)
  return zone
}

interface DnsRecord {
  readonly id: string
  readonly type: string
  readonly name: string
  readonly content: string
}

async function main(): Promise<void> {
  const [domain, ...flags] = process.argv.slice(2)
  const apply = flags.includes('--apply')

  if (domain === undefined || !(domain in SUBDOMAINS)) {
    throw new Error(
      `Usage: cloudflare-zone-setup.ts <${Object.keys(SUBDOMAINS).join('|')}> [--apply]`
    )
  }

  console.log(`${apply ? 'APPLYING' : 'PLAN (pass --apply to write)'} — ${domain}\n`)

  const zone = await findOrCreateZone(domain, apply)
  if (zone === undefined) {
    console.log('\nRe-run with --apply to create the zone, then again to add records.')
    return
  }

  if (zone.name_servers !== undefined) {
    console.log(`\n  nameservers to set at the registrar:`)
    for (const server of zone.name_servers) console.log(`    ${server}`)
  }

  const existing = await api<readonly DnsRecord[]>(`/zones/${zone.id}/dns_records?type=A`)
  const known = new Set(existing.map(record => `${record.name}|${record.content}`))

  console.log('\n  records:')
  for (const sub of SUBDOMAINS[domain] ?? []) {
    const fqdn = sub === '@' ? domain : `${sub}.${domain}`
    const addresses = await currentRecords(fqdn)

    if (addresses.length === 0) {
      console.log(`    ${fqdn.padEnd(28)} no A records found upstream — skipped`)
      continue
    }

    for (const address of addresses) {
      if (known.has(`${fqdn}|${address}`)) {
        console.log(`    ${fqdn.padEnd(28)} ${address.padEnd(16)} already present`)
        continue
      }
      if (!apply) {
        console.log(`    ${fqdn.padEnd(28)} ${address.padEnd(16)} WOULD CREATE`)
        continue
      }
      await api(`/zones/${zone.id}/dns_records`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'A',
          name: fqdn,
          content: address,
          ttl: 120,
          // Grey-cloud deliberately. Proxying changes how traffic is served, and
          // this step exists to change NOTHING except which server answers.
          proxied: false
        })
      })
      console.log(`    ${fqdn.padEnd(28)} ${address.padEnd(16)} created`)
    }
  }

  console.log(
    [
      '',
      'Next, in order:',
      '  1. Verify these records resolve from the Cloudflare nameservers directly:',
      `       dig @${zone.name_servers?.[0] ?? '<ns>'} ${domain} A`,
      '  2. Change nameservers at the registrar. Behaviour should not change at all —',
      '     same answers, different server. That is the point.',
      '  3. Only once that is stable, repoint records at Workers custom domains.',
      '',
      'Keep the old DNS zone for two weeks. While it exists, rollback is one',
      'nameserver change.'
    ].join('\n')
  )
}

// Print the message, not a stack trace. Every throw in here is an operator
// problem — a missing token, a wrong scope, a typo'd domain — and burying the
// instruction under twenty frames of Bun internals helps nobody.
try {
  await main()
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
}

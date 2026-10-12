#!/usr/bin/env bun
/**
 * Vendor Cloudflare's agent skills into `.claude/skills/`.
 *
 * They are checked in rather than installed, so cloning the repo is the whole
 * setup — no command to run, nothing to remember, and CI and every contributor
 * see the same guidance. `wrangler --install-skills` exists but writes to the
 * *global* agent path (`~/.claude/skills`), which makes Cloudflare skills apply
 * to every repo on the machine including ones with no Cloudflare in them.
 * Project scope is the right default.
 *
 * Deliberately a SUBSET. Cloudflare publishes thirteen; two match what this
 * repo actually runs. A skill list is context every session pays for whether or
 * not it gets used, so one earns its place by use, not by existing.
 *
 * Fetches ONE tarball rather than walking the contents API. The API needs a
 * request per directory, and the `cloudflare` skill alone nests deeply enough to
 * exhaust the unauthenticated 60/hour limit halfway through — which fails after
 * having already written some skills, leaving `.claude/skills` half-updated.
 *
 * Only the WANTED directories are replaced. `.claude/skills` is shared with
 * first-party skills, and an earlier version that replaced the whole directory
 * deleted four of them (#1225) without anyone noticing.
 *
 * The tarball is pinned to an upstream commit, so a sync is reproducible and its
 * diff has a known base. To refresh, set COMMIT to a newer cloudflare/skills
 * SHA, run `bun run skills:sync`, and read the diff: this pulls third-party
 * prose that steers an agent straight into the repo.
 */
import { mkdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

const REPO = 'cloudflare/skills'
/** cloudflare/skills main on 2026-08-07, the tree vendored in #1225. */
const COMMIT = 'f96bff754e428838818017f75817f0f9428acd48'
const TARBALL = `https://codeload.github.com/${REPO}/tar.gz/${COMMIT}`
const ROOT = join(import.meta.dir, '..')
const DEST = join(ROOT, '.claude', 'skills')

/**
 * Why each of these is here. If one stops matching what the repo runs, delete
 * it — an unused skill is not free.
 */
const WANTED: Readonly<Record<string, string>> = {
  'workers-best-practices': 'The site and the bot Worker run on Workers',
  wrangler:
    'Deploys run `wrangler deploy`; three wrangler configs are checked in (site, bot, notation.randsum.dev redirect)'
}

/**
 * Skills deliberately NOT vendored, and why — so the next person does not have
 * to re-derive the decision:
 *
 * - `cloudflare` — the whole-platform reference. Measured at **1.9 MB across
 *   ~285 files**, against 56 KB for the two above combined, and it documents
 *   Queues, D1, R2, AI and Zero Trust, none of which this repo uses. Checking it
 *   in would multiply the vendored payload by thirty for guidance about
 *   products we do not run.
 * - `durable-objects` — evaluated during the migration and rejected: the bot
 *   answers HTTP interactions and holds no gateway connection for a DO to keep.
 * - `agents-sdk`, `cloudflare-one*`, `sandbox-*`, `turnstile-spin`,
 *   `cloudflare-email-service` — no corresponding surface in this repo.
 * - `web-perf` — needs the chrome-devtools MCP server, which is not
 *   configured; its first step is to STOP without it. Re-add it alongside a
 *   pinned chrome-devtools server when a perf audit actually runs.
 *
 * Add one when something here needs it. `bun run skills:sync` picks up whatever
 * is listed above.
 */

async function run(command: readonly string[], cwd: string): Promise<void> {
  const proc = Bun.spawn([...command], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const code = await proc.exited
  if (code !== 0) {
    throw new Error(
      `${command.join(' ')} exited ${code}: ${await new Response(proc.stderr).text()}`
    )
  }
}

async function main(): Promise<void> {
  const staging = join(ROOT, '.skills-sync-tmp')
  await rm(staging, { recursive: true, force: true })
  await mkdir(staging, { recursive: true })

  try {
    const response = await fetch(TARBALL)
    if (!response.ok) throw new Error(`Download failed: ${response.status}`)
    const archive = join(staging, 'skills.tar.gz')
    await Bun.write(archive, await response.arrayBuffer())

    // `--strip-components=2` drops the `skills-main/skills/` prefix, so each
    // wanted skill lands as a top-level directory.
    await run(
      [
        'tar',
        '-xzf',
        'skills.tar.gz',
        '--strip-components=2',
        ...Object.keys(WANTED).map(name => `*/skills/${name}`)
      ],
      staging
    )

    // Replace each wanted skill rather than merge, so a file dropped upstream
    // actually disappears. Touch nothing else in DEST: first-party skills live
    // there too. A skill removed from WANTED is deleted by hand.
    await mkdir(DEST, { recursive: true })
    for (const name of Object.keys(WANTED)) {
      await rm(join(DEST, name), { recursive: true, force: true })
      await rename(join(staging, name), join(DEST, name))
    }

    console.log(`Synced ${Object.keys(WANTED).length} Cloudflare skills from ${REPO}@${COMMIT}:`)
    for (const [name, why] of Object.entries(WANTED)) {
      console.log(`  ${name.padEnd(24)} — ${why}`)
    }
    console.log('\nReview the diff before committing — this is third-party prose.')
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

await main()

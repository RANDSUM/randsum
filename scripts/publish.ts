#!/usr/bin/env bun

/**
 * Publish Script
 *
 * Usage:
 *   bun run publish                  # publish all non-private workspace packages
 *   bun run publish -- --dry-run     # simulate without publishing
 *   bun run publish -- --otp=123456  # provide 2FA OTP (local only)
 *   bun scripts/publish.ts --dry-run --pack-dir=DIR  # keep the tarballs in DIR (CI lints them)
 *
 * Uses `bun pm pack` to resolve workspace: protocols, then `npm publish`
 * on the tarball. In CI, auth is handled by npm Trusted Publishing (OIDC) —
 * no NPM_TOKEN — and `--provenance` (added only under GITHUB_ACTIONS) attests
 * the build to the workflow run. Local publishes omit provenance and use
 * `--otp`. Requires npm >= 11.5.1, Node >= 22.14, `id-token: write` on the job.
 *
 * Publishes workspace packages in dependency order, skips private ones.
 */

import { join, resolve } from 'path'
import { $ } from 'bun'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const ROOT = join(import.meta.dir, '..')

/**
 * Hardcoded topological publish order.
 * Packages must be published in dependency order so that downstream
 * packages can resolve their dependencies on the registry.
 */
const PUBLISH_ORDER: readonly string[] = ['packages/roller', 'packages/games', 'packages/mcp']

async function getPublishablePackages(): Promise<{ name: string; dir: string }[]> {
  const packages: { name: string; dir: string }[] = []

  for (const relDir of PUBLISH_ORDER) {
    const pkgPath = join(ROOT, relDir, 'package.json')
    const pkgFile = Bun.file(pkgPath)
    if (!(await pkgFile.exists())) {
      continue
    }
    const pkg = (await pkgFile.json()) as { name: string; private?: boolean; version: string }
    if (!pkg.private) {
      packages.push({ name: pkg.name, dir: join(ROOT, relDir) })
    }
  }

  return packages
}

/**
 * Guard: assert a packed tarball's manifest carries no unresolved `workspace:` protocol.
 *
 * The `workspace:` protocol is a bun/pnpm dev-time reference that MUST be resolved to a real
 * semver range at pack time — `bun pm pack` does this. If a tarball ever ships `workspace:~`
 * to the registry, `npm install` of that package hard-fails with
 * `EUNSUPPORTEDPROTOCOL Unsupported URL Type "workspace:"`, making it completely uninstallable.
 *
 * This exact failure shipped in the legacy standalone game packages (@randsum/salvageunion,
 * daggerheart, blades, fifth, root-rpg, pbta) when they were published with a raw `npm publish`
 * (which does NOT resolve `workspace:`) before this script existed. This guard makes that class
 * of breakage impossible to publish again, independent of which tool packed the tarball.
 */
async function assertNoWorkspaceProtocol(tgzPath: string, name: string): Promise<void> {
  const manifestText = await $`tar -xzOf ${tgzPath} package/package.json`.text()
  const manifest = JSON.parse(manifestText) as Record<string, unknown>
  const depFields = [
    'dependencies',
    'peerDependencies',
    'optionalDependencies',
    'devDependencies'
  ] as const
  const offenders: string[] = []
  for (const field of depFields) {
    const deps = manifest[field]
    if (deps && typeof deps === 'object') {
      for (const [dep, range] of Object.entries(deps as Record<string, unknown>)) {
        if (typeof range === 'string' && range.startsWith('workspace:')) {
          offenders.push(`${field}.${dep} = ${range}`)
        }
      }
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      `${name} tarball still contains unresolved workspace: protocol — this would be ` +
        `uninstallable via npm (EUNSUPPORTEDPROTOCOL). Refusing to publish.\n` +
        offenders.map(o => `    ${o}`).join('\n')
    )
  }
}

/**
 * Pack @randsum/roller with `sideEffects: false` injected into the published manifest.
 *
 * The in-repo package.json keeps `sideEffects: true` because bunup's self-DCE breaks roller's
 * dist when it builds with `false`. But consumers installing the published package should be able to tree-shake the
 * narrow surfaces (e.g. `isDiceNotation`) out of the engine. `bun pm pack` does NOT rebuild dist
 * or run prepublishOnly, so we flip the field only for the pack and restore it immediately after —
 * the tarball ships the already-built healthy dist with a tree-shakeable manifest. See ADR-018.
 */
async function packRollerWithSideEffectsFalse(dir: string, destination: string): Promise<string> {
  const pkgPath = join(dir, 'package.json')
  const original = await Bun.file(pkgPath).text()
  const patched = original.replace(/"sideEffects":\s*true/, '"sideEffects": false')
  if (patched === original) {
    throw new Error(
      'Expected roller package.json to contain `"sideEffects": true` to flip for publish'
    )
  }
  try {
    await Bun.write(pkgPath, patched)
    return await pack(dir, destination)
  } finally {
    await Bun.write(pkgPath, original)
  }
}

/** Pack `dir` into `destination` and return the tarball path `bun pm pack` reports. */
async function pack(dir: string, destination: string): Promise<string> {
  const tgzPath = (await $`bun pm pack --destination ${destination} --quiet`.cwd(dir).text()).trim()
  if (!tgzPath.endsWith('.tgz')) {
    throw new Error(`bun pm pack did not report a .tgz path (got: ${tgzPath})`)
  }
  return tgzPath
}

const PACK_DIR_FLAG = '--pack-dir='
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const packDirArg = args.find(arg => arg.startsWith(PACK_DIR_FLAG))
// Everything except our own flag is forwarded to `npm publish` (--dry-run, --otp=...).
const extraArgs = args.filter(arg => !arg.startsWith(PACK_DIR_FLAG))
// --pack-dir keeps the tarballs for later inspection; otherwise they go to a temp dir
// that is removed once every package has been tried, whether or not it published.
const packDir = packDirArg
  ? resolve(packDirArg.slice(PACK_DIR_FLAG.length))
  : mkdtempSync(join(tmpdir(), 'randsum-publish-'))
mkdirSync(packDir, { recursive: true })

const packages = await getPublishablePackages()

console.log(`\nPublishing ${packages.length} packages${dryRun ? ' (dry run)' : ''}:\n`)
for (const { name } of packages) {
  console.log(`  ${name}`)
}
console.log()

const failed: string[] = []

/* eslint-disable no-await-in-loop, no-console -- CLI script: sequential I/O by design, console output intentional */
for (const { name, dir } of packages) {
  console.log(`--- ${name} ---`)
  try {
    const tgzPath =
      name === '@randsum/roller'
        ? await packRollerWithSideEffectsFalse(dir, packDir)
        : await pack(dir, packDir)
    console.log(`  packed ${tgzPath}`)

    // Refuse to publish a tarball that still carries an unresolved workspace: protocol —
    // it would be uninstallable via npm. See assertNoWorkspaceProtocol for the incident.
    await assertNoWorkspaceProtocol(tgzPath, name)

    const npmArgs = ['publish', tgzPath, '--access=public']
    // Provenance requires an OIDC-capable CI; skip it for local --otp publishes.
    if (process.env['GITHUB_ACTIONS'] === 'true') {
      npmArgs.push('--provenance')
    }
    for (const arg of extraArgs) {
      npmArgs.push(arg)
    }

    const result = await $`npm ${npmArgs}`.nothrow().quiet()
    const output = result.stderr.toString()

    if (result.exitCode === 0) {
      console.log(`  ${dryRun ? 'would publish' : 'published'} ${name}`)
    } else if (output.includes('You cannot publish over the previously published')) {
      console.log(`  skipped ${name} (version already published)`)
    } else {
      console.error(output)
      failed.push(name)
    }
  } catch (e) {
    console.error(String(e))
    failed.push(name)
  }
  console.log()
}
/* eslint-enable no-await-in-loop, no-console */

if (!packDirArg) {
  rmSync(packDir, { recursive: true, force: true })
}

if (failed.length > 0) {
  console.error(`Failed to publish: ${failed.join(', ')}`)
  process.exit(1)
}

console.log(dryRun ? 'Dry run complete.' : 'All packages published successfully.')

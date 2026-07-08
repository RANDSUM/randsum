#!/usr/bin/env bun

/**
 * Publish Script
 *
 * Usage:
 *   bun run publish                  # publish all non-private workspace packages
 *   bun run publish -- --dry-run     # simulate without publishing
 *   bun run publish -- --otp=123456  # provide 2FA OTP (local only)
 *
 * Uses `bun pm pack` to resolve workspace: protocols, then `npm publish`
 * on the tarball. In CI, auth is handled by npm Trusted Publishing (OIDC) —
 * no NPM_TOKEN — and `--provenance` (added only under GITHUB_ACTIONS) attests
 * the build to the workflow run. Local publishes omit provenance and use
 * `--otp`. Requires npm >= 11.5.1, Node >= 22.14, `id-token: write` on the job.
 *
 * Publishes workspace packages in dependency order, skips private ones.
 */

import { join } from 'path'
import { $ } from 'bun'
import { unlinkSync } from 'node:fs'

const ROOT = join(import.meta.dir, '..')

/**
 * Hardcoded topological publish order.
 * Packages must be published in dependency order so that downstream
 * packages can resolve their dependencies on the registry.
 */
const PUBLISH_ORDER: readonly string[] = [
  'packages/roller',
  'packages/games',
  'packages/mcp',
  'apps/cli'
]

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
 * Pack @randsum/roller with `sideEffects: false` injected into the published manifest.
 *
 * The in-repo package.json keeps `sideEffects: true` because bunup's self-DCE breaks roller's
 * dist when it builds with `false`, AND the cli bundles roller from source (noExternal) and reads
 * that field. But consumers installing the published package should be able to tree-shake the
 * narrow surfaces (e.g. `isDiceNotation`) out of the engine. `bun pm pack` does NOT rebuild dist
 * or run prepublishOnly, so we flip the field only for the pack and restore it immediately after —
 * the tarball ships the already-built healthy dist with a tree-shakeable manifest. See ADR-018.
 */
async function packRollerWithSideEffectsFalse(dir: string): Promise<string> {
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
    return await $`bun pm pack`.cwd(dir).text()
  } finally {
    await Bun.write(pkgPath, original)
  }
}

const extraArgs = process.argv.slice(2)
const dryRun = extraArgs.includes('--dry-run')

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
    const packOutput =
      name === '@randsum/roller'
        ? await packRollerWithSideEffectsFalse(dir)
        : await $`bun pm pack`.cwd(dir).text()
    const tgzMatch = packOutput.match(/^Total files:.*$/m)
    const tgzFile = (await Array.fromAsync(new Bun.Glob('*.tgz').scan(dir)))[0]
    if (!tgzFile) {
      throw new Error('bun pm pack did not produce a .tgz file')
    }
    const tgzPath = join(dir, tgzFile)

    if (tgzMatch) {
      console.log(tgzMatch[0])
    }

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
      console.log(`  published ${name}`)
    } else if (output.includes('You cannot publish over the previously published')) {
      console.log(`  skipped ${name} (version already published)`)
    } else {
      console.error(output)
      failed.push(name)
    }

    unlinkSync(tgzPath)
  } catch (e) {
    console.error(String(e))
    failed.push(name)
  }
  console.log()
}
/* eslint-enable no-await-in-loop, no-console */

if (failed.length > 0) {
  console.error(`Failed to publish: ${failed.join(', ')}`)
  process.exit(1)
}

console.log('All packages published successfully.')

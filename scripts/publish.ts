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
 * on the tarball. In CI with `id-token: write`, npm handles OIDC Trusted
 * Publishers auth automatically via --provenance.
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
const PUBLISH_ORDER: readonly string[] = ['packages/roller', 'packages/games', 'apps/cli']

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

const extraArgs = process.argv.slice(2)
const dryRun = extraArgs.includes('--dry-run')
const isCI = Boolean(process.env.CI)

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
    const packOutput = await $`bun pm pack`.cwd(dir).text()
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
    if (isCI) {
      npmArgs.push('--provenance')
    }
    for (const arg of extraArgs) {
      npmArgs.push(arg)
    }

    await $`npm ${npmArgs}`

    unlinkSync(tgzPath)
  } catch {
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

#!/usr/bin/env bun

/**
 * Publish Script
 *
 * Usage:
 *   bun run publish                  # publish all non-private workspace packages
 *   bun run publish -- --dry-run     # simulate without publishing
 *   bun run publish -- --otp=123456  # provide 2FA OTP
 *
 * Publishes workspace packages in dependency order, skips private ones.
 * workspace: protocol references are replaced with real versions by bun publish.
 */

import { join } from 'path'
import { $ } from 'bun'

const ROOT = join(import.meta.dir, '..')

/**
 * Hardcoded topological publish order.
 * Packages must be published in dependency order so that downstream
 * packages can resolve their dependencies on the registry.
 */
const PUBLISH_ORDER: readonly string[] = [
  'packages/notation',
  'packages/roller',
  'packages/internal/display-utils',
  'packages/games',
  'packages/internal/component-library',
  'apps/cli',
]

async function getPublishablePackages(): Promise<
  { name: string; dir: string }[]
> {
  const packages: { name: string; dir: string }[] = []

  for (const relDir of PUBLISH_ORDER) {
    const pkgPath = join(ROOT, relDir, 'package.json')
    const pkgFile = Bun.file(pkgPath)
    if (!(await pkgFile.exists())) {
      continue
    }
    const pkg = (await pkgFile.json()) as { name: string; private?: boolean }
    if (!pkg.private) {
      packages.push({ name: pkg.name, dir: join(ROOT, relDir) })
    }
  }

  return packages
}

const extraArgs = process.argv.slice(2)
const dryRun = extraArgs.includes('--dry-run')
const publishArgs = ['--access=public', ...extraArgs]

const packages = await getPublishablePackages()

console.log(
  `\nPublishing ${packages.length} packages${dryRun ? ' (dry run)' : ''}:\n`
)
for (const { name } of packages) {
  console.log(`  ${name}`)
}
console.log()

const failed: string[] = []

for (const { name, dir } of packages) {
  console.log(`--- ${name} ---`)
  try {
    await $`bun publish ${publishArgs}`.cwd(dir)
  } catch {
    failed.push(name)
  }
  console.log()
}

if (failed.length > 0) {
  console.error(`Failed to publish: ${failed.join(', ')}`)
  process.exit(1)
}

console.log('All packages published successfully.')

#!/usr/bin/env bun

/**
 * Publish Script
 *
 * Usage:
 *   bun run publish                  # publish all non-private workspace packages
 *   bun run publish -- --dry-run     # simulate without publishing
 *   bun run publish -- --otp=123456  # provide 2FA OTP
 *
 * Iterates all workspace packages, skips private ones, runs `bun publish` in each.
 * workspace: protocol references are replaced with real versions by bun publish.
 */

import { dirname, join } from 'path'
import { $ } from 'bun'

const ROOT = join(import.meta.dir, '..')

async function getPublishablePackages(): Promise<{ name: string; dir: string }[]> {
  const rootPkg = (await Bun.file(join(ROOT, 'package.json')).json()) as {
    workspaces: string[]
  }
  const packages: { name: string; dir: string }[] = []

  for (const pattern of rootPkg.workspaces) {
    if (pattern.endsWith('/*')) {
      const baseDir = pattern.slice(0, -2)
      const glob = new Bun.Glob('*/package.json')
      for await (const file of glob.scan({ cwd: join(ROOT, baseDir) })) {
        const pkg = (await Bun.file(join(ROOT, baseDir, file)).json()) as {
          name: string
          private?: boolean
        }
        if (!pkg.private) {
          packages.push({ name: pkg.name, dir: join(ROOT, baseDir, dirname(file)) })
        }
      }
    } else {
      const pkgFile = Bun.file(join(ROOT, pattern, 'package.json'))
      if (await pkgFile.exists()) {
        const pkg = (await pkgFile.json()) as { name: string; private?: boolean }
        if (!pkg.private) {
          packages.push({ name: pkg.name, dir: join(ROOT, pattern) })
        }
      }
    }
  }

  return packages
}

const extraArgs = process.argv.slice(2)
const dryRun = extraArgs.includes('--dry-run')
const publishArgs = ['--access=public', ...extraArgs]

const packages = await getPublishablePackages()

console.log(`\nPublishing ${packages.length} packages${dryRun ? ' (dry run)' : ''}:\n`)
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

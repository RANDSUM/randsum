#!/usr/bin/env bun

/**
 * One-off remediation: republish the broken legacy standalone game packages.
 *
 * INCIDENT
 * --------
 * Six legacy standalone game packages had their `latest` dist-tag pointing at a
 * version that shipped a literal, unresolved `"@randsum/roller": "workspace:~"`
 * dependency. Those versions were published with a raw `npm publish` (before
 * scripts/publish.ts existed) — and `npm publish` does NOT resolve the bun/pnpm
 * `workspace:` protocol the way `bun pm pack` does. The result: every one of
 * these packages is completely uninstallable —
 *
 *     npm error code EUNSUPPORTEDPROTOCOL
 *     npm error Unsupported URL Type "workspace:": workspace:~
 *
 * These packages are already deprecated in favour of `@randsum/games/<game>`
 * subpath exports, but deprecation is only a warning: npm still resolves the
 * dependency tree and hard-fails, so consumers cannot even install them to see
 * the redirect.
 *
 * FIX
 * ---
 * Republish each with a patch bump and the `workspace:~` reference resolved to
 * `~1.1.2` — the last @randsum/roller 1.1.x, which is the roller these 1.x game
 * builds were compiled against. (roller 1.2.3 removed `createGameRoll` /
 * `createMultiRollGameRoll`, which four of these packages import, so pinning to
 * roller 1.3.0 fixes install but breaks import — hence ~1.1.2, verified to both
 * install and import for all six.) The deprecation notice is re-applied to the
 * new version so the redirect is preserved.
 *
 * This is a MANUAL, one-time op — these packages are not in the workspace, so
 * the changesets/Trusted-Publishing pipeline never touches them. Publishing is
 * 2FA-gated (auth-and-writes), so an OTP is required.
 *
 * USAGE
 * -----
 *   bun scripts/republish-legacy-1x.ts --dry-run          # build + verify only, no publish
 *   bun scripts/republish-legacy-1x.ts --otp=123456       # actually publish + re-deprecate
 *
 * Prevention against a recurrence of this exact class of bug lives in
 * scripts/publish.ts (assertNoWorkspaceProtocol).
 */

import { join } from 'node:path'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { $ } from 'bun'

/** The roller range these 1.x game builds were compiled against. */
const ROLLER_PIN = '~1.1.2'

interface Target {
  readonly name: string
  /** Broken version currently tagged `latest`. */
  readonly broken: string
  /** Patched version to publish. */
  readonly next: string
  /** Deprecation message to re-apply to the new version. */
  readonly deprecate: string
}

const TARGETS: readonly Target[] = [
  {
    name: '@randsum/salvageunion',
    broken: '1.0.0',
    next: '1.0.1',
    deprecate: 'Use @randsum/games/salvageunion instead. See https://randsum.dev'
  },
  {
    name: '@randsum/daggerheart',
    broken: '1.1.0',
    next: '1.1.1',
    deprecate: 'Use @randsum/games/daggerheart instead. See https://randsum.dev'
  },
  {
    name: '@randsum/blades',
    broken: '1.1.0',
    next: '1.1.1',
    deprecate: 'Use @randsum/games/blades instead. See https://randsum.dev'
  },
  {
    name: '@randsum/fifth',
    broken: '1.1.0',
    next: '1.1.1',
    deprecate: 'Use @randsum/games/fifth instead. See https://randsum.dev'
  },
  {
    name: '@randsum/root-rpg',
    broken: '1.0.0',
    next: '1.0.1',
    deprecate: 'Use @randsum/games/root-rpg instead. See https://randsum.dev'
  },
  {
    name: '@randsum/pbta',
    broken: '1.0.0',
    next: '1.0.1',
    deprecate: 'Use @randsum/games/pbta instead. See https://randsum.dev'
  }
] as const

const extraArgs = process.argv.slice(2)
const dryRun = extraArgs.includes('--dry-run')
const otpArg = extraArgs.find(a => a.startsWith('--otp='))

if (!dryRun && !otpArg) {
  console.error(
    'Refusing to publish without an OTP. Pass --otp=<code> (2FA is auth-and-writes),\n' +
      'or run with --dry-run to build and verify the corrected tarballs first.'
  )
  process.exit(1)
}

/**
 * Repack a published version with `version` bumped and every `workspace:` dep resolved.
 * Returns the path to the corrected tarball.
 */
async function buildCorrectedTarball(target: Target, workdir: string): Promise<string> {
  await $`npm pack ${target.name}@${target.broken}`.cwd(workdir).quiet()
  const original = (await Array.fromAsync(new Bun.Glob('*.tgz').scan(workdir)))[0]
  if (!original) {
    throw new Error(`npm pack produced no tarball for ${target.name}@${target.broken}`)
  }
  await $`tar -xzf ${original}`.cwd(workdir).quiet()

  const pkgPath = join(workdir, 'package', 'package.json')
  const manifest = (await Bun.file(pkgPath).json()) as {
    version: string
    dependencies?: Record<string, string>
  }
  const deps = manifest.dependencies ?? {}
  const workspaceDeps = Object.entries(deps).filter(([, range]) => range.startsWith('workspace:'))
  if (workspaceDeps.length === 0) {
    throw new Error(`${target.name}@${target.broken} had no workspace: dep — unexpected, aborting`)
  }
  const resolvedDeps = Object.fromEntries(
    Object.entries(deps).map(([dep, range]) => {
      if (!range.startsWith('workspace:')) {
        return [dep, range]
      }
      if (dep !== '@randsum/roller') {
        throw new Error(
          `Unexpected non-roller workspace: dep ${dep} in ${target.name} — no pin known`
        )
      }
      return [dep, ROLLER_PIN]
    })
  )
  const nextManifest = { ...manifest, version: target.next, dependencies: resolvedDeps }
  await Bun.write(pkgPath, JSON.stringify(nextManifest, null, 2) + '\n')

  const packDir = join(workdir, 'package')
  const packOut = await $`npm pack`.cwd(packDir).text()
  const lines = packOut.trim().split('\n')
  const fixed = lines[lines.length - 1]
  if (!fixed) {
    throw new Error(`npm pack produced no tarball for ${target.name}@${target.next}`)
  }
  return join(packDir, fixed)
}

/**
 * Install a corrected tarball into a throwaway project and import it, proving it
 * both resolves (no EUNSUPPORTEDPROTOCOL) and loads (roller API present).
 */
async function verifyTarball(target: Target, tgzPath: string): Promise<void> {
  const consumer = mkdtempSync(join(tmpdir(), 'randsum-verify-'))
  await $`npm init -y`.cwd(consumer).quiet()
  await $`npm install ${tgzPath}`.cwd(consumer).quiet()
  await $`node --input-type=module -e ${`await import(${JSON.stringify(target.name)})`}`
    .cwd(consumer)
    .quiet()
}

const failed: string[] = []
for (const target of TARGETS) {
  console.log(`\n--- ${target.name} ${target.broken} -> ${target.next} ---`)
  const workdir = mkdtempSync(join(tmpdir(), 'randsum-republish-'))
  try {
    const tgzPath = await buildCorrectedTarball(target, workdir)
    await verifyTarball(target, tgzPath)
    console.log(`  built + verified (installs & imports against roller ${ROLLER_PIN})`)

    if (dryRun) {
      console.log('  dry run — not publishing')
      continue
    }

    // otpArg is guaranteed present here: the top-level guard exits unless dryRun || otpArg.
    const otp = otpArg ?? ''
    const result = await $`npm publish ${tgzPath} --access=public ${otp}`.nothrow()
    if (result.exitCode !== 0) {
      console.error(result.stderr.toString())
      failed.push(target.name)
      continue
    }
    console.log(`  published ${target.name}@${target.next}`)

    await $`npm deprecate ${`${target.name}@${target.next}`} ${target.deprecate} ${otp}`.quiet()
    console.log('  re-applied deprecation notice')
  } catch (e) {
    console.error(String(e))
    failed.push(target.name)
  }
}

if (failed.length > 0) {
  console.error(`\nFailed: ${failed.join(', ')}`)
  process.exit(1)
}
console.log(`\nAll ${TARGETS.length} legacy packages ${dryRun ? 'verified' : 'republished'}.`)

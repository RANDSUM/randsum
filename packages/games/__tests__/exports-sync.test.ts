/**
 * Guards the hand-maintained `package.json#exports` contract for @randsum/games.
 *
 * History: bunup's `exports: true` option auto-rewrites `package.json#exports`
 * from bundler-derived output paths. Its common-prefix inference is fragile —
 * adding a single new entry can flip every subpath key (e.g. `./blades` →
 * `./src/blades`) and silently break consumers. We disabled `exports: true`
 * in `bunup.config.ts`; this test is the safety net that catches any regression
 * (bunup upgrade re-enables it, someone re-adds the flag, package.json drifts
 * from actual dist output, etc.).
 *
 * What this test asserts:
 *   1. Every key declared in `package.json#exports` points at a file that
 *      exists in `dist/` after a build.
 *   2. Every build entry that *should* be a public subpath is declared in
 *      `package.json#exports`.
 *
 * Run `bun run build` before this test.
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const packageDir = resolve(import.meta.dirname, '..')
const packageJsonPath = join(packageDir, 'package.json')
const distDir = join(packageDir, 'dist')

interface ExportConditions {
  readonly import?: {
    readonly types?: string
    readonly default?: string
  }
}

type ExportEntry = string | ExportConditions

interface PackageJson {
  readonly exports: Record<string, ExportEntry>
}

function isConditional(entry: ExportEntry): entry is ExportConditions {
  return typeof entry === 'object' && entry !== null
}

function collectTargets(entry: ExportEntry): readonly string[] {
  if (typeof entry === 'string') return [entry]
  if (isConditional(entry) && entry.import) {
    const imp = entry.import
    const targets: string[] = []
    if (imp.types) targets.push(imp.types)
    if (imp.default) targets.push(imp.default)
    return targets
  }
  return []
}

describe('package.json#exports contract', () => {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson

  test('every declared exports target exists in dist/', () => {
    const missing: string[] = []
    for (const [key, entry] of Object.entries(pkg.exports)) {
      for (const target of collectTargets(entry)) {
        // Skip `./package.json` — it points at the package.json itself, not dist.
        if (target === './package.json') continue
        const absolute = join(packageDir, target)
        if (!existsSync(absolute)) {
          missing.push(`${key} → ${target}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  test('every per-game dist entry is declared as a subpath export', () => {
    // If `dist/<shortcode>.generated.js` exists, `./<shortcode>` must be in exports.
    if (!existsSync(distDir)) {
      throw new Error(
        'dist/ not found. Run `bun run --filter @randsum/games build` before this test.'
      )
    }
    const gameFiles = readdirSync(distDir).filter(
      f => f.endsWith('.generated.js') && !f.includes('.map')
    )
    const exportKeys = new Set(Object.keys(pkg.exports))
    const undeclared: string[] = []
    for (const file of gameFiles) {
      // Extract shortcode: `blades.generated.js` → `blades`
      const shortcode = file.replace('.generated.js', '')
      const expectedKey = `./${shortcode}`
      if (!exportKeys.has(expectedKey)) {
        undeclared.push(`dist/${file} has no matching '${expectedKey}' export`)
      }
    }
    expect(undeclared).toEqual([])
  })

  test('bunup config does not enable the exports rewrite flag', () => {
    const configPath = join(packageDir, 'bunup.config.ts')
    const source = readFileSync(configPath, 'utf-8')
    // Strip line and block comments before scanning, so our own documentation
    // of this contract does not false-positive.
    const stripped = source.replaceAll(/\/\*[\s\S]*?\*\//g, '').replaceAll(/\/\/[^\n]*/g, '')
    // `exports: true` (or `exports: { ... }`) re-enables the fragile
    // auto-rewrite. package.json#exports must remain hand-maintained.
    expect(stripped).not.toMatch(/\bexports\s*:\s*(true|\{)/)
  })
})

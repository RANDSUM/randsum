#!/usr/bin/env bun

/**
 * Workspace Script Guard
 *
 * Usage: bun run check:workspace-scripts
 *
 * Asserts that every workspace package declares the standard script set. This
 * exists because `bun run --filter '*' <script>` SILENTLY SKIPS packages that
 * do not declare the target script — which is how packages/dice-ui escaped
 * linting for months (audit Wave 3). The root aggregate scripts rely on that
 * skip-tolerance for optional scripts (e.g. `size`), so a package that simply
 * omits `lint`/`test`/`typecheck` would drop out of every gate unnoticed.
 *
 * Wiring: this guard runs at the head of the root `check` chain and as its own
 * CI job feeding the CI Gate, so a newly-added package that forgets a standard
 * script fails the build instead of quietly opting out.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Scripts every workspace package MUST declare. Kept in sync with the per-package
// `check` chain (typecheck + format:check + lint + test) plus format for the
// writing counterpart. `size` is intentionally NOT here — it stays per-package
// optional (only publishable packages define size-limit budgets), and the root
// `size` script is skip-tolerant by design.
const REQUIRED_SCRIPTS = ['test', 'lint', 'format', 'format:check', 'typecheck', 'check'] as const

// `build` is required for every package EXCEPT source-only packages that ship
// their `src` directly (no bundling step). New entries here are a deliberate,
// reviewable opt-out — a package cannot silently drop `build` without appearing
// in this list.
const BUILD_EXEMPT = new Set<string>(['@randsum/dice-ui'])

const WORKSPACE_DIRS = ['packages', 'apps'] as const

const ROOT = join(import.meta.dir, '..')

interface PackageManifest {
  readonly name?: string
  readonly scripts?: Record<string, string>
}

const findManifests = (): readonly { readonly dir: string; readonly manifest: PackageManifest }[] =>
  WORKSPACE_DIRS.flatMap(workspaceDir => {
    const base = join(ROOT, workspaceDir)
    return readdirSync(base)
      .map(entry => join(base, entry))
      .filter(path => statSync(path).isDirectory())
      .map(path => join(path, 'package.json'))
      .filter(manifestPath => {
        try {
          return statSync(manifestPath).isFile()
        } catch {
          return false
        }
      })
      .map(manifestPath => ({
        dir: manifestPath,
        manifest: JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest
      }))
  })

const problems: string[] = []

for (const { dir, manifest } of findManifests()) {
  const name = manifest.name ?? dir
  const scripts = manifest.scripts ?? {}
  const required = [...REQUIRED_SCRIPTS, ...(BUILD_EXEMPT.has(name) ? [] : ['build'])]
  const missing = required.filter(script => !(script in scripts))
  if (missing.length > 0) {
    problems.push(`  ${name}: missing ${missing.join(', ')}`)
  }
}

if (problems.length > 0) {
  console.error(
    'Workspace script guard failed. Every package must declare the standard set\n' +
      `(${REQUIRED_SCRIPTS.join(', ')}, and build unless source-only):\n\n` +
      problems.join('\n') +
      '\n\nAdd the missing script(s), or — for an intentional build opt-out —\n' +
      'add the package to BUILD_EXEMPT in scripts/check-workspace-scripts.ts.'
  )
  process.exit(1)
}

console.log('Workspace script guard passed: all packages declare the standard set.')

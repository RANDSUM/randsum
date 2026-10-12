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
 * omits `test`/`typecheck` would drop out of every gate unnoticed. (Linting has
 * since moved to one root `biome ci .`, which reaches every file by construction,
 * and dice-ui has since folded into apps/site.)
 *
 * Wiring: this guard runs at the head of the root `check` chain and as its own
 * CI job feeding the CI Success gate, so a newly-added package that forgets a
 * standard script fails the build instead of quietly opting out.
 *
 * It also asserts that every apps/<app>/wrangler.jsonc declares the same
 * `compatibility_date`, so the three Workers share one runtime baseline and no
 * config comment can claim a match that is not there.
 *
 * Config parity it also holds:
 * - every published package declares the same `engines` block, and private
 *   workspaces declare none (the root manifest owns the dev toolchain floor);
 * - every LICENSE under packages/ or apps/ is byte-identical to the root LICENSE,
 *   and every published package ships one;
 * - apps/site and apps/rdn pin identical astro, @astrojs/check,
 *   @astrojs/sitemap and typescript specs (a guard rather than a named catalog:
 *   no Dependabot run has ever bumped a catalog entry).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

// Scripts every workspace package MUST declare. Kept in sync with the per-package
// `check` chain (typecheck + test). Lint and format are not here: one root
// `biome ci .` covers every package plus scripts/ and root configs, so no package
// can drop out of it. `size` is intentionally NOT here either — it stays
// per-package optional (only publishable packages define size-limit budgets),
// and the root `size` script is skip-tolerant by design.
const REQUIRED_SCRIPTS = ['test', 'typecheck', 'check'] as const

// `build` is required for every package EXCEPT source-only packages that ship
// their `src` directly (no bundling step). New entries here are a deliberate,
// reviewable opt-out — a package cannot silently drop `build` without appearing
// in this list.
//
// `@randsum/discord-bot` is exempt because wrangler compiles `src/worker/index.ts`
// itself at deploy time. It had a `build` only while it also shipped a Node
// gateway process that bunup had to bundle for a host to run; with that gone
// there is no artifact left to produce.
const BUILD_EXEMPT = new Set<string>(['@randsum/discord-bot'])

const WORKSPACE_DIRS = ['packages', 'apps'] as const

const ROOT = join(import.meta.dir, '..')

interface PackageManifest {
  readonly name?: string
  readonly private?: boolean
  readonly scripts?: Record<string, string>
  readonly engines?: Record<string, string>
  readonly dependencies?: Record<string, string>
  readonly devDependencies?: Record<string, string>
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

const manifests = findManifests()
const problems: string[] = []

for (const { dir, manifest } of manifests) {
  const name = manifest.name ?? dir
  const scripts = manifest.scripts ?? {}
  const required = [...REQUIRED_SCRIPTS, ...(BUILD_EXEMPT.has(name) ? [] : ['build'])]
  const missing = required.filter(script => !(script in scripts))
  if (missing.length > 0) {
    problems.push(`  ${name}: missing ${missing.join(', ')}`)
  }
}

// One compatibility_date across every apps/<app>/wrangler.jsonc. A targeted
// regex rather than a JSONC parse: the files carry comments, and only this one
// key matters here.
const COMPAT_DATE = /^\s*"compatibility_date"\s*:\s*"([^"]+)"/m

const appsDir = join(ROOT, 'apps')
const compatDates = readdirSync(appsDir)
  .map(entry => join(appsDir, entry, 'wrangler.jsonc'))
  .filter(path => {
    try {
      return statSync(path).isFile()
    } catch {
      return false
    }
  })
  .map(path => ({
    path: path.slice(ROOT.length + 1),
    date: COMPAT_DATE.exec(readFileSync(path, 'utf8'))?.[1]
  }))

const distinctDates = new Set(compatDates.map(({ date }) => date))
const compatProblem =
  distinctDates.size > 1 || distinctDates.has(undefined)
    ? 'Every apps/<app>/wrangler.jsonc must declare the same compatibility_date:\n\n' +
      compatDates.map(({ path, date }) => `  ${path}: ${date ?? 'missing'}`).join('\n') +
      "\n\nSet them to one date, no newer than the pinned wrangler's workerd supports."
    : undefined

// Config parity: engines, LICENSE, and the hand-copied Astro pins.
const parityProblems: string[] = []
const rel = (path: string): string => relative(ROOT, path)

const published = manifests.filter(({ manifest }) => manifest.private !== true)
const enginesSpecs = new Set(
  published.map(({ manifest }) => JSON.stringify(manifest.engines ?? null))
)
if (enginesSpecs.size > 1 || enginesSpecs.has('null')) {
  parityProblems.push(
    'Every published package must declare the same engines block:\n' +
      published
        .map(({ dir, manifest }) => `  ${rel(dir)}: ${JSON.stringify(manifest.engines ?? null)}`)
        .join('\n')
  )
}
const privateWithEngines = manifests.filter(
  ({ manifest }) => manifest.private === true && manifest.engines !== undefined
)
if (privateWithEngines.length > 0) {
  parityProblems.push(
    'Private workspaces must not declare engines (the root manifest owns the toolchain floor):\n' +
      privateWithEngines.map(({ dir }) => `  ${rel(dir)}`).join('\n')
  )
}

const rootLicense = readFileSync(join(ROOT, 'LICENSE'))
const licenseProblems = manifests.flatMap(({ dir, manifest }) => {
  const license = join(dirname(dir), 'LICENSE')
  if (!existsSync(license)) {
    return manifest.private === true ? [] : [`  ${rel(license)}: missing`]
  }
  return readFileSync(license).equals(rootLicense)
    ? []
    : [`  ${rel(license)}: differs from LICENSE`]
})
if (licenseProblems.length > 0) {
  parityProblems.push(
    'Every workspace LICENSE must be byte-identical to the root LICENSE (copy it over):\n' +
      licenseProblems.join('\n')
  )
}

const ASTRO_PINNED = ['astro', '@astrojs/check', '@astrojs/sitemap', 'typescript'] as const
const ASTRO_APPS = ['apps/site', 'apps/rdn'] as const
const specsOf = (app: string): Record<string, string> => {
  const found = manifests.find(({ dir }) => rel(dir) === `${app}/package.json`)
  return { ...found?.manifest.dependencies, ...found?.manifest.devDependencies }
}
const astroDrift = ASTRO_PINNED.filter(
  dep => new Set(ASTRO_APPS.map(app => specsOf(app)[dep])).size > 1
)
if (astroDrift.length > 0) {
  parityProblems.push(
    `${ASTRO_APPS.join(' and ')} must pin identical specs for ${ASTRO_PINNED.join(', ')}:\n` +
      astroDrift
        .map(
          dep =>
            `  ${dep}: ${ASTRO_APPS.map(app => `${app} ${specsOf(app)[dep] ?? 'missing'}`).join(', ')}`
        )
        .join('\n')
  )
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

if (compatProblem !== undefined) {
  console.error(`Workspace script guard failed. ${compatProblem}`)
  process.exit(1)
}

if (parityProblems.length > 0) {
  console.error(`Workspace script guard failed. Config parity:\n\n${parityProblems.join('\n\n')}`)
  process.exit(1)
}

console.log(
  'Workspace script guard passed: all packages declare the standard set, all Workers share one compatibility_date, and engines, LICENSE and Astro pins are in parity.'
)

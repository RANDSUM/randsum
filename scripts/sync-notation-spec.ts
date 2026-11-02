#!/usr/bin/env bun

/**
 * Notation Spec Mirror
 *
 * Usage: bun scripts/sync-notation-spec.ts <dir>
 *
 * Writes the standalone github.com/RANDSUM/notation-spec tree into <dir> from
 * packages/notation-spec, the source of truth. The mirror must build and test on
 * its own, outside the workspace, so the copy differs from the package in a few
 * places only:
 *
 * - package.json: the root build toolchain (bunup, typescript, @types/bun) is
 *   added, the monorepo-only prepublishOnly guard is dropped, and `private` is
 *   set so nothing publishes from the mirror (npm releases go through
 *   scripts/publish.ts here);
 * - vendor/roller/: the roller build from this commit, which the reference
 *   adapter runs against (`@randsum/roller` is `file:./vendor/roller`). The
 *   vectors are written beside roller and can need a roller change before it is
 *   released, so testing the mirror against the published roller would turn it
 *   red until the next release. This way the mirror tests exactly what passed
 *   here, and scripts/check-notation-mirror.ts proves it before every sync;
 * - tsconfig.json: the root compiler options inlined instead of extended;
 * - the files in scripts/notation-spec-mirror/ (its CI workflow, .gitignore),
 *   and the root .bun-version, which that workflow installs.
 *
 * Everything in <dir> except .git is replaced, so a file deleted here is
 * deleted there. .github/workflows/sync-notation-spec.yml runs this on main and
 * pushes the result; run it locally to inspect the tree.
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { $ } from 'bun'

const ROOT = join(import.meta.dir, '..')
const PACKAGE = 'packages/notation-spec'
const TEMPLATE = join(import.meta.dir, 'notation-spec-mirror')

const outArg = process.argv[2]
if (outArg === undefined) {
  console.error('Usage: bun scripts/sync-notation-spec.ts <dir>')
  process.exit(1)
}
const OUT = resolve(outArg)

type Json = Record<string, unknown>
const readJson = (path: string): Json => JSON.parse(readFileSync(path, 'utf8')) as Json
/** The root tsconfig is JSONC: drop whole-line comments before parsing. */
const readJsonc = (path: string): Json =>
  JSON.parse(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
  ) as Json
const writeJson = (path: string, value: unknown): void => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

const rootManifest = readJson(join(ROOT, 'package.json'))
const catalog = rootManifest['catalog'] as Record<string, string>
const rootDev = rootManifest['devDependencies'] as Record<string, string>
const toolVersion = (name: string): string => {
  const range = rootDev[name]
  if (range === undefined) throw new Error(`The root package.json has no devDependency ${name}`)
  return range === 'catalog:' ? (catalog[name] ?? range) : range
}
const ROLLER = join(ROOT, 'packages/roller')
const VENDORED: Record<string, string> = { '@randsum/roller': 'file:./vendor/roller' }
const vendoredRange = (name: string): string => {
  const range = VENDORED[name]
  if (range === undefined) throw new Error(`No vendored build for the workspace package ${name}`)
  return range
}

// Start from an empty tree, keeping the mirror's own history.
mkdirSync(OUT, { recursive: true })
for (const entry of readdirSync(OUT)) {
  if (entry !== '.git') rmSync(join(OUT, entry), { recursive: true, force: true })
}

// Tracked files only, so build output and node_modules never reach the mirror.
const tracked = (await $`git ls-files -- ${PACKAGE}`.cwd(ROOT).text()).split('\n').filter(Boolean)
for (const file of tracked) {
  const target = join(OUT, file.slice(PACKAGE.length + 1))
  mkdirSync(dirname(target), { recursive: true })
  cpSync(join(ROOT, file), target)
}
cpSync(TEMPLATE, OUT, { recursive: true })
cpSync(join(ROOT, '.bun-version'), join(OUT, '.bun-version'))

// The roller build from this commit, without source maps.
await $`bun run build`.cwd(ROLLER).quiet()
// The last commit that touched roller, not HEAD, so a sync that changes nothing
// else leaves vendor/ alone.
const commit = (await $`git log -1 --format=%H -- packages/roller`.cwd(ROOT).text()).trim()
const vendor = join(OUT, 'vendor/roller')
cpSync(join(ROLLER, 'dist'), join(vendor, 'dist'), {
  recursive: true,
  filter: source => !source.endsWith('.map')
})
cpSync(join(ROLLER, 'LICENSE'), join(vendor, 'LICENSE'))
const roller = readJson(join(ROLLER, 'package.json'))
writeJson(join(vendor, 'package.json'), {
  name: roller['name'],
  description: `${String(roller['description'])}. Built from RANDSUM/randsum@${commit} (the last roller change before the sync) for the reference adapter.`,
  version: roller['version'],
  private: true,
  type: roller['type'],
  sideEffects: roller['sideEffects'],
  exports: roller['exports'],
  license: roller['license'],
  repository: roller['repository']
})
writeFileSync(
  join(vendor, 'README.md'),
  `# vendor/roller

The \`@randsum/roller\` build from [RANDSUM/randsum@${commit.slice(0, 7)}](https://github.com/RANDSUM/randsum/tree/${commit}/packages/roller), the last change to roller before this mirror was synced. The reference adapter in \`examples/randsum-roller/\` runs against it, so the vectors are always tested against the roller they were written beside, released or not. Install \`@randsum/roller\` from npm to use the roller itself. MIT, see \`LICENSE\`.
`
)

const manifest = readJson(join(ROOT, PACKAGE, 'package.json'))
const devDependencies = Object.fromEntries(
  Object.entries((manifest['devDependencies'] ?? {}) as Record<string, string>).map(
    ([name, range]) => [name, range.startsWith('workspace:') ? vendoredRange(name) : range]
  )
)
const scripts = { ...(manifest['scripts'] as Record<string, string>) }
delete scripts['prepublishOnly']
writeJson(join(OUT, 'package.json'), {
  ...manifest,
  private: true,
  scripts,
  devDependencies: {
    ...devDependencies,
    '@types/bun': toolVersion('@types/bun'),
    bunup: toolVersion('bunup'),
    typescript: toolVersion('typescript')
  }
})

const pkgTsconfig = readJsonc(join(ROOT, PACKAGE, 'tsconfig.json'))
const rootTsconfig = readJsonc(join(ROOT, 'tsconfig.json'))
writeJson(join(OUT, 'tsconfig.json'), {
  compilerOptions: rootTsconfig['compilerOptions'],
  include: pkgTsconfig['include']
})

console.warn(`Wrote the notation-spec mirror to ${OUT} (${tracked.length} files)`)

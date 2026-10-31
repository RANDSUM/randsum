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
 * - package.json: `workspace:~` ranges become the published versions, the root
 *   build toolchain (bunup, typescript, @types/bun) is added, the monorepo-only
 *   prepublishOnly guard is dropped, and `private` is set so nothing publishes
 *   from the mirror (npm releases go through scripts/publish.ts here);
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
const workspaceVersion = (name: string): string => {
  const dir = name.replace('@randsum/', 'packages/')
  return `^${String(readJson(join(ROOT, dir, 'package.json'))['version'])}`
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

const manifest = readJson(join(ROOT, PACKAGE, 'package.json'))
const devDependencies = Object.fromEntries(
  Object.entries((manifest['devDependencies'] ?? {}) as Record<string, string>).map(
    ([name, range]) => [name, range.startsWith('workspace:') ? workspaceVersion(name) : range]
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

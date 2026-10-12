#!/usr/bin/env bun

/**
 * Doc Claims Guard
 *
 * Usage: bun run check:doc-claims
 *
 * Fails when agent-facing prose names something the code does not have.
 *
 * WHY THIS EXISTS
 * ---------------
 * CLAUDE.md files, agent definitions and skills are read as instructions, so a
 * stale line is not a cosmetic bug: an agent runs the script it was told to run,
 * imports the path it was shown, and teaches users the notation it read. Docs
 * drift is this repo's recurring pain (#1085, #1132), and each class of drift
 * below was found live by the 2026-10 audit: a `check:all` script documented in
 * six places after it was deleted, a skill importing `@randsum/test-utils` (404
 * on npm), notation the engine rejects, and bundle limits copied into prose that
 * no longer matched `package.json`.
 *
 * Every one of those can be found mechanically, so it is checked here rather
 * than described. This generalizes the two guards beside it
 * (check:workspace-scripts, check:ci-aggregator) and is wired the same way: at
 * the head of the root `check` chain and as its own job under CI Success.
 *
 * WHAT IS CHECKED
 * ---------------
 * In every CLAUDE.md, README.md, CONTRIBUTING.md and llms.txt, the agent
 * definitions in .claude/agents/, the first-party skills in .claude/skills/ and
 * everything under plugins/:
 *
 *   script    `bun run [--filter <pkg>] <name>` names a script that package has
 *   path      a backticked repo path, a relative link, or a repo path in a code
 *             block exists in the tree (gitignored build output is skipped)
 *   import    `@randsum/<pkg>[/<sub>]` is a workspace package and, with a
 *             subpath, one of that package's `exports`
 *   notation  every string passed to `roll("…")`, and every notation in the first
 *             cell of a table row, passes `validateNotation`
 *   size      no KB figure on a line about bundle size or size-limit; the limits
 *             live in each package.json and a copy only drifts
 *
 * The vendored Cloudflare skills are skipped: their prose is Cloudflare's, and
 * scripts/sync-cloudflare-skills.ts overwrites it on every sync.
 *
 * Exit codes: 0 — every claim holds; 1 — at least one does not.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { validateNotation } from '../packages/roller/src/validate'

const ROOT = join(import.meta.dir, '..')

/**
 * `@randsum/*` names that are mentioned on purpose but are not workspace
 * packages, each with the reason. Keep it as short as it deserves to be.
 */
const UNKNOWN_PACKAGE_ALLOWLIST = new Map<string, string>([
  ['cli', 'removed package; the dice-rolling skill says so explicitly'],
  ['notation', 'merged into roller (ADR-005); roller CLAUDE.md warns against reviving it']
])

interface Problem {
  readonly file: string
  readonly line: number
  readonly message: string
}

interface Manifest {
  readonly dir: string
  readonly name: string
  readonly scripts: Readonly<Record<string, string>>
  readonly exports: ReadonlySet<string>
}

const git = (...args: readonly string[]): string => {
  const proc = Bun.spawnSync(['git', ...args], { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' })
  if (proc.exitCode !== 0 && proc.exitCode !== 1) {
    console.error(`git ${args.join(' ')} failed:\n${proc.stderr.toString()}`)
    process.exit(1)
  }
  return proc.stdout.toString()
}

const tracked: readonly string[] = git('ls-files', '-z').split('\0').filter(Boolean)
const trackedFiles = new Set(tracked)
const trackedDirs = new Set(
  tracked.flatMap(file =>
    file
      .split('/')
      .slice(0, -1)
      .map((_, i, parts) => parts.slice(0, i + 1).join('/'))
  )
)
const topLevel = new Set(tracked.map(file => file.split('/')[0] ?? ''))

const existsInTree = (path: string): boolean => {
  const clean = normalize(path).replace(/\/$/, '')
  return clean === '.' || trackedFiles.has(clean) || trackedDirs.has(clean)
}

const readManifest = (dir: string): Manifest | null => {
  const path = join(ROOT, dir, 'package.json')
  if (!existsSync(path)) return null
  const json: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (typeof json !== 'object' || json === null) return null
  const record = json as Record<string, unknown>
  const scripts = (record['scripts'] ?? {}) as Record<string, string>
  const rawExports = record['exports']
  const exports =
    typeof rawExports === 'object' && rawExports !== null
      ? new Set(Object.keys(rawExports))
      : new Set(['.'])
  return { dir, name: typeof record['name'] === 'string' ? record['name'] : '', scripts, exports }
}

const rootManifest = readManifest('.')
if (rootManifest === null) {
  console.error('Doc claims guard failed: cannot read the root package.json.')
  process.exit(1)
}

const workspaces: readonly Manifest[] = tracked
  .filter(file => /^(packages|apps)\/[^/]+\/package\.json$/.test(file))
  .flatMap(file => {
    const manifest = readManifest(dirname(file))
    return manifest ? [manifest] : []
  })
const byName = new Map(workspaces.map(manifest => [manifest.name, manifest]))

/** The directory names `.claude/skills/` vendors from Cloudflare, read from the sync script. */
const vendoredSkills = (): ReadonlySet<string> => {
  const source = readFileSync(join(ROOT, 'scripts/sync-cloudflare-skills.ts'), 'utf8')
  const block = source.match(/const WANTED[^{]*\{([\s\S]*?)\n\}/)?.[1]
  if (block === undefined) {
    console.error(
      'Doc claims guard failed: cannot find WANTED in scripts/sync-cloudflare-skills.ts.'
    )
    process.exit(1)
  }
  return new Set([...block.matchAll(/^\s*'?([\w-]+)'?:/gm)].flatMap(m => (m[1] ? [m[1]] : [])))
}

const VENDORED = vendoredSkills()

const isScanned = (file: string): boolean => {
  if (!file.endsWith('.md') && !file.endsWith('.txt')) return false
  // The changesets README is the tool's boilerplate; the ADR index describes
  // history, and ADRs are superseded rather than rewritten (docs/adr/README.md).
  if (/(^|\/)(CLAUDE|README|CONTRIBUTING)\.md$/.test(file)) {
    return file !== '.changeset/README.md' && !file.startsWith('docs/adr/')
  }
  if (/(^|\/)llms\.txt$/.test(file)) return true
  if (/^\.claude\/agents\/[^/]+\.md$/.test(file)) return true
  const skill = file.match(/^\.claude\/skills\/([^/]+)\//)?.[1]
  if (skill !== undefined) return !VENDORED.has(skill)
  return file.startsWith('plugins/') && file.endsWith('.md')
}

/** The workspace package a doc belongs to: the nearest ancestor with a package.json. */
const owningManifest = (file: string): Manifest => {
  const parts = dirname(file).split('/')
  const found = parts
    .map((_, i) => parts.slice(0, parts.length - i).join('/'))
    .map(dir => workspaces.find(manifest => manifest.dir === dir))
    .find(manifest => manifest !== undefined)
  return found ?? rootManifest
}

// ---------------------------------------------------------------------------
// Claim extractors. Each takes one line of one doc and returns problems.
// ---------------------------------------------------------------------------

interface Context {
  readonly file: string
  readonly dir: string
  readonly manifest: Manifest
  readonly inFence: boolean
}

const BUN_RUN = /\bbun run((?:\s+--filter(?:=|\s+)\S+)*)\s+([A-Za-z](?:[\w:.-]*\w)?)/g

/** Packages a `--filter` value selects: a name, a name glob, or a `./path`. */
const filterTargets = (raw: string): readonly Manifest[] => {
  const value = raw.replace(/^['"]|['"]$/g, '')
  if (value.startsWith('./')) {
    const dir = normalize(value)
    return workspaces.filter(manifest => manifest.dir === dir)
  }
  const pattern = new RegExp(
    `^${value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`
  )
  return workspaces.filter(manifest => pattern.test(manifest.name))
}

const checkScripts = (line: string, ctx: Context): readonly string[] =>
  [...line.matchAll(BUN_RUN)].flatMap(match => {
    const filters = [...(match[1] ?? '').matchAll(/--filter(?:=|\s+)(\S+)/g)].map(m => m[1] ?? '')
    const script = match[2] ?? ''
    // `bun run path/to/file.ts` runs a file, not a script.
    if (/[/]|\.(ts|js|mjs|cjs|tsx)$/.test(script)) return []

    if (filters.length === 0) {
      const has = script in ctx.manifest.scripts || script in rootManifest.scripts
      return has ? [] : [`\`bun run ${script}\`: no script \`${script}\` in ${where(ctx.manifest)}`]
    }
    return filters.flatMap(filter => {
      if (filter.includes('<')) return []
      const targets = filterTargets(filter)
      if (targets.length === 0) return [`\`--filter ${filter}\` matches no workspace package`]
      return targets.some(manifest => script in manifest.scripts)
        ? []
        : [`\`bun run --filter ${filter} ${script}\`: no script \`${script}\` in ${filter}`]
    })
  })

const where = (manifest: Manifest): string =>
  manifest === rootManifest ? 'the root package.json' : `${manifest.name} or the root package.json`

/** Path segments that only ever hold build output or installed deps. */
const GENERATED_SEGMENT = /(^|\/)(dist|node_modules|coverage|\.astro|\.wrangler)(\/|$)/

const isPathLike = (token: string): boolean =>
  token.includes('/') &&
  !/[\s*<>{}$|`'"()?=,]/.test(token) &&
  !token.includes('://') &&
  !token.startsWith('@') &&
  !token.startsWith('/') &&
  !token.startsWith('~') &&
  !token.startsWith('-') &&
  !token.startsWith('#') &&
  // `./fifth`, `./errors`: a package.json export key, which the import check covers.
  !/^\.\/[\w-]+$/.test(token) &&
  !GENERATED_SEGMENT.test(token)

/** Strip a trailing `:42`, `:42-50` or `#anchor` from a path reference. */
const bare = (token: string): string => token.replace(/(:\d+(-\d+)?|#.*)$/, '')

/** A module specifier names its file without the extension: `src/lib/utils/validation`. */
const MODULE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts'] as const

const resolves = (token: string, ctx: Context): boolean =>
  [token, join(ctx.dir, token), join(ctx.manifest.dir, token)].some(base =>
    MODULE_SUFFIXES.some(suffix => existsInTree(base + suffix))
  )

/**
 * Only a token that starts at a real directory is treated as a path claim. That
 * keeps prose like `and/or`, `Fate/Fudge` or `+X/-X` out without a word list.
 */
const anchored = (token: string, ctx: Context): boolean => {
  const first = token.split('/')[0] ?? ''
  if (first === '.' || first === '..') return true
  return [first, join(ctx.dir, first), join(ctx.manifest.dir, first)].some(
    candidate => topLevel.has(candidate) || trackedDirs.has(candidate)
  )
}

const checkPaths = (line: string, ctx: Context): readonly string[] => {
  const inline = ctx.inFence ? [] : [...line.matchAll(/`([^`\n]+)`/g)].map(m => m[1] ?? '')
  const links = ctx.inFence
    ? []
    : [...line.matchAll(/\]\(([^)\s]+)\)/g)]
        .map(m => m[1] ?? '')
        .filter(target => !/^[a-z]+:/i.test(target) && !target.startsWith('#'))
  // In a code block only a token rooted at a top-level repo directory is a claim:
  // `bun test packages/roller/...` is, `src/foo.ts` inside a user example is not.
  const fenced = ctx.inFence
    ? (line.match(/[\w.@/-]+/g) ?? []).filter(token => {
        const first = token.split('/')[0] ?? ''
        return token.includes('/') && topLevel.has(first) && trackedDirs.has(first)
      })
    : []

  const fromLinks = links
    .map(bare)
    .filter(target => target !== '' && !GENERATED_SEGMENT.test(target))
    .filter(target => !existsInTree(join(ctx.dir, decodeURI(target))))
    .map(target => `link target \`${target}\` does not exist`)

  const fromTokens = [...inline, ...fenced]
    .map(bare)
    .filter(isPathLike)
    .filter(token => anchored(token, ctx))
    .filter(token => !resolves(token, ctx))
    .map(token => `path \`${token}\` does not exist`)

  return [...fromLinks, ...fromTokens]
}

const PACKAGE_REF = /@randsum\/([a-z0-9][a-z0-9-]*)(\/[a-z0-9][\w.-]*)?/g

const checkImports = (line: string): readonly string[] =>
  [...line.matchAll(PACKAGE_REF)].flatMap(match => {
    const name = match[1] ?? ''
    const sub = match[2]
    // A URL path after the name (npm badges, unpkg links) is not a subpath export.
    const before = line.slice(0, match.index)
    if (/https?:\/\/\S*$/.test(before)) return []
    const manifest = byName.get(`@randsum/${name}`)
    if (manifest === undefined) {
      return UNKNOWN_PACKAGE_ALLOWLIST.has(name)
        ? []
        : [`\`@randsum/${name}\` is not a workspace package`]
    }
    if (sub === undefined || manifest.exports.has(`.${sub}`)) return []
    return [
      `\`@randsum/${name}${sub}\` is not in ${manifest.name}'s exports (${[...manifest.exports].join(', ')})`
    ]
  })

/** A line that demonstrates a failure on purpose: `roll('xyz') // throws`. */
const DEMONSTRATES_ERROR = /\b(throws?|invalid|error|rejects?|rejected|fails?)\b/i

/**
 * The string literals passed directly to `roll(...)` from `start`: a scan that
 * tracks quotes and nesting, so `roll("5d10F{3}")` keeps its braces while a
 * string inside an options object (`roll({ key: 'x' })`) is not an argument.
 */
const argumentsFrom = (line: string, start: number): readonly string[] => {
  const state: { depth: number; quote: string; current: string; strings: string[] } = {
    depth: 0,
    quote: '',
    current: '',
    strings: []
  }
  for (const char of line.slice(start)) {
    if (state.quote !== '') {
      if (char === state.quote) {
        if (state.depth === 0) state.strings.push(state.current)
        state.quote = ''
        state.current = ''
      } else state.current += char
    } else if (char === '"' || char === "'") state.quote = char
    else if (char === '{' || char === '[' || char === '(') state.depth += 1
    else if (char === '}' || char === ']') state.depth -= 1
    else if (char === ')') {
      if (state.depth === 0) break
      state.depth -= 1
    }
  }
  return state.strings
}

const rollArguments = (line: string): readonly string[] =>
  [...line.matchAll(/(?<![\w.])roll\(/g)].flatMap(match =>
    argumentsFrom(line, (match.index ?? 0) + match[0].length)
  )

/** A notation-shaped token: a dice term first (`4d6`, `d%`, `dF`, `g6`, `3DD6`). */
const DICE_FIRST = /^\d*(d\d|d%|dF|D\d|DD\d|g\d)/

const tableNotation = (line: string): readonly string[] => {
  const firstCell = line.match(/^\s*\|\s*`([^`]+)`\s*\|/)?.[1]
  return firstCell !== undefined && DICE_FIRST.test(firstCell) ? [firstCell] : []
}

const checkNotation = (line: string): readonly string[] => {
  if (DEMONSTRATES_ERROR.test(line)) return []
  return [...rollArguments(line), ...tableNotation(line)]
    .filter(notation => notation !== '' && DICE_FIRST.test(notation))
    .filter(notation => !validateNotation(notation).valid)
    .map(notation => `notation \`${notation}\` fails validateNotation`)
}

const SIZE_TOPIC = /size-limit|size limit|bundle size/i
const KB_FIGURE = /\d+(\.\d+)?\s?(KB|kB|KiB)\b/

const checkSize = (line: string): readonly string[] =>
  SIZE_TOPIC.test(line) && KB_FIGURE.test(line)
    ? ['KB figure next to a size limit; point at the package.json `size-limit` instead']
    : []

// ---------------------------------------------------------------------------

const scanned = tracked.filter(isScanned).sort()

if (scanned.length === 0) {
  console.error('Doc claims guard failed: matched zero docs — the file filter is wrong.')
  process.exit(1)
}

const problems: readonly Problem[] = scanned.flatMap(file => {
  const lines = readFileSync(join(ROOT, file), 'utf8').split('\n')
  const manifest = owningManifest(file)
  const fence: { open: boolean } = { open: false }
  return lines.flatMap((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fence.open = !fence.open
      return []
    }
    const ctx: Context = { file, dir: dirname(file), manifest, inFence: fence.open }
    return [
      ...checkScripts(line, ctx),
      ...checkPaths(line, ctx),
      ...checkImports(line),
      ...checkNotation(line),
      ...checkSize(line)
    ].map(message => ({ file, line: index + 1, message }))
  })
})

if (problems.length > 0) {
  console.error(
    `Doc claims guard failed: ${problems.length} claim(s) in prose do not match the code.\n\n` +
      problems.map(p => `  ${p.file}:${p.line}  ${p.message}`).join('\n') +
      '\n\nFix the doc, or the code if the doc is right. A deliberate mention of something that\n' +
      'does not exist belongs in an allowlist in scripts/check-doc-claims.ts, with a reason.'
  )
  process.exit(1)
}

console.log(
  `Doc claims guard passed: scripts, paths, @randsum imports, notation and size figures ` +
    `hold across ${scanned.length} docs.`
)

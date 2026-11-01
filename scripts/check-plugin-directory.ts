#!/usr/bin/env bun

/**
 * Plugin Directory Guard
 *
 * Usage: bun run check:plugin-directory
 *
 * Anthropic's plugin directory scans every version of plugins/randsum before it
 * lists it, and `claude plugin validate --strict --profile directory` (run in CI)
 * covers only the manifest side of that scan. This guard holds the rest of the
 * findings the directory has raised against this plugin to zero:
 *
 * - every file stays under 256 KiB and is text or a PNG/JPEG/GIF/WebP image;
 * - no file carries a download-and-run command (`curl … | sh`, `node -e`,
 *   `npx`, …): the skills reach dice through the MCP server or the HTTP API;
 * - the `/roll` mod's code defines no accessor, Proxy, `then` method or
 *   `Object.defineProperty`, which the scan reads as code that runs when a
 *   value is merely read or awaited;
 * - plugin.json carries a semver `version`, and a change under plugins/randsum
 *   bumps it, because installers update only when the version changes.
 *
 * The version check compares against PLUGIN_BASE_REF (CI passes the pull
 * request's base branch) and otherwise against origin/main; it is skipped on
 * CI runs with no base, such as pushes to main.
 *
 * Exit codes: 0 — clean; 1 — a finding.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const PLUGIN = 'plugins/randsum'
const MANIFEST = `${PLUGIN}/.claude-plugin/plugin.json`
const MAX_BYTES = 256 * 1024
const TEXT = new Set(['.md', '.json', '.ts', '.js', '.txt'])
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

const DOWNLOAD_AND_RUN: readonly (readonly [RegExp, string])[] = [
  [/\b(curl|wget)\b[^\n]*\|\s*(sudo\s+)?(ba|z)?sh\b/, 'pipes a download into a shell'],
  [/\bnode\s+(-e|-p|--eval|--print)\b/, 'runs inline code with node'],
  [/\bbun\s+(-e|--eval)\b/, 'runs inline code with bun'],
  [/\bdeno\s+eval\b/, 'runs inline code with deno'],
  [/\bpython3?\s+-c\b/, 'runs inline code with python'],
  [/\b(ba|z)?sh\s+-c\b/, 'runs an inline shell script'],
  [/\b(npx|bunx|uvx|pnpx)\s/, 'downloads and runs a package'],
  [/\bpipx\s+run\b/, 'downloads and runs a package']
]

const ACCESSOR: readonly (readonly [RegExp, string])[] = [
  [/\bObject\.definePropert(y|ies)\b/, 'Object.defineProperty'],
  [/\b__define[GS]etter__\b/, '__defineGetter__'],
  [/\bnew\s+Proxy\b/, 'a Proxy'],
  [/^\s*(static\s+)?[gs]et\s+[\w$#]+\s*\(/m, 'a getter or setter'],
  [/(^|[{,]\s*)then\s*[:(]/m, 'a then method']
]

function filesUnder(dir: string): readonly string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

function git(args: readonly string[]): string | undefined {
  const result = Bun.spawnSync(['git', ...args], { cwd: ROOT, stderr: 'ignore' })
  return result.exitCode === 0 ? result.stdout.toString() : undefined
}

function versionOf(source: string | undefined): string | undefined {
  if (source === undefined) return undefined
  const parsed: unknown = JSON.parse(source)
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) return undefined
  return typeof parsed.version === 'string' ? parsed.version : undefined
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

const findings: string[] = []
const files = filesUnder(PLUGIN)

for (const file of files) {
  const ext = extname(file).toLowerCase()
  const bytes = statSync(join(ROOT, file)).size
  if (bytes >= MAX_BYTES) findings.push(`${file}: ${bytes} bytes, over the 256 KiB limit`)
  if (!TEXT.has(ext) && !IMAGE.has(ext)) {
    findings.push(`${file}: not a text file or a PNG/JPEG/GIF/WebP image`)
    continue
  }
  if (!TEXT.has(ext)) continue

  const source = readFileSync(join(ROOT, file), 'utf8')
  for (const [pattern, reason] of DOWNLOAD_AND_RUN) {
    const match = pattern.exec(source)
    if (match)
      findings.push(`${file}:${lineOf(source, match.index)}: ${reason} (${match[0].trim()})`)
  }
  if (file.startsWith(`${PLUGIN}/hooks/`) && (ext === '.js' || ext === '.ts')) {
    for (const [pattern, what] of ACCESSOR) {
      const match = pattern.exec(source)
      if (match) findings.push(`${file}:${lineOf(source, match.index)}: the mod defines ${what}`)
    }
  }
}

const version = versionOf(readFileSync(join(ROOT, MANIFEST), 'utf8'))
if (version === undefined || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  findings.push(`${MANIFEST}: needs a semver "version"`)
}

const baseRef = process.env['PLUGIN_BASE_REF']
const base = baseRef
  ? `origin/${baseRef}`
  : process.env['GITHUB_ACTIONS']
    ? undefined
    : 'origin/main'

if (base === undefined) {
  console.log('No base branch: skipped the plugin version bump check.')
} else {
  const changed = git(['diff', '--name-only', `${base}...HEAD`, '--', PLUGIN])
  if (changed === undefined) {
    findings.push(`could not diff against ${base}; fetch it (CI checks out with fetch-depth: 0)`)
  } else if (changed.trim() !== '') {
    const baseVersion = versionOf(git(['show', `${base}:${MANIFEST}`]))
    if (baseVersion !== undefined && baseVersion === version) {
      findings.push(
        `${MANIFEST}: ${PLUGIN} changed since ${base} but "version" is still ${version}; bump it so installs update`
      )
    }
  }
}

if (findings.length > 0) {
  console.error('Plugin directory guard found:')
  for (const finding of findings) console.error(`  - ${finding}`)
  process.exit(1)
}

console.log(
  `Plugin directory guard passed: ${files.length} files in ${relative(ROOT, join(ROOT, PLUGIN))}.`
)

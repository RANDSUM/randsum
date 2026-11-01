#!/usr/bin/env bun

/**
 * Plugin Scan Guard: keep plugins/randsum free of the patterns Anthropic's
 * plugin directory warns about
 *
 * Usage: bun run check:plugin-scan
 *
 * The directory scans every version it ingests from `main`. Its warnings do not
 * block a listing, but each one is a question a reviewer has to clear, so this
 * check fails on the ones the repo has already fixed once:
 *
 *   - size/format:      every file under 256 KiB, and text or a PNG/JPEG/GIF/WebP
 *   - download-and-run: shell that fetches and executes, or `node -e`, in any file
 *   - credential:       code reading crypto, env vars, the home directory or keychains
 *   - accessor:         code defining getters, Proxies, `then` methods or
 *                       Object.defineProperty, which run on a mere read or await
 *   - listing:          README of at least 40 words, a `license` and a `version`
 *
 * `claude plugin validate --strict plugins/randsum` (CI) covers the manifest
 * schema; scripts/check-plugin-version.ts covers version bumps.
 *
 * Exit codes: 0 — clean; 1 — a finding (each printed with file and line).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const PLUGIN = join(ROOT, 'plugins/randsum')
const MAX_BYTES = 256 * 1024
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])
const TEXT = new Set(['.md', '.json', '.ts', '.js', '.txt'])
const CODE = new Set(['.ts', '.js'])

interface Rule {
  readonly name: string
  readonly pattern: RegExp
  readonly appliesTo: (ext: string) => boolean
}

const RULES: readonly Rule[] = [
  {
    name: 'download-and-run',
    pattern:
      /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(sh|bash|zsh|node|python3?|bun)\b|\$\((curl|wget)\b|\bnode\s+(-e|--eval)\b|\bnpx\s+-y\b|\b(iex|Invoke-Expression)\b/,
    appliesTo: () => true
  },
  {
    name: 'credential',
    pattern:
      /\bcrypto\s*\.|require\(\s*['"](node:)?crypto['"]\s*\)|from\s+['"](node:)?crypto['"]|\bprocess\.env\b|\bhomedir\s*\(|\.ssh\b|\bkeychain\b|\.npmrc\b|\bgh\s+auth\s+token\b/i,
    appliesTo: ext => CODE.has(ext)
  },
  {
    name: 'accessor',
    pattern:
      /^\s*(static\s+)?get\s+[\w$#]+\s*\(|\bObject\.defineProperty\b|__defineGetter__|\bnew\s+Proxy\b|^\s*(async\s+)?then\s*\(|\bthen\s*:\s*(async\s+)?(function|\()/,
    appliesTo: ext => CODE.has(ext)
  }
]

function walk(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const findings = walk(PLUGIN).flatMap(path => {
  const rel = relative(ROOT, path)
  const ext = extname(path).toLowerCase()
  const size = statSync(path).size
  const sizeFindings =
    size >= MAX_BYTES ? [`${rel}: ${size} bytes, over the directory's 256 KiB limit`] : []
  if (IMAGE.has(ext)) return sizeFindings
  if (!TEXT.has(ext)) return [...sizeFindings, `${rel}: not readable text or a PNG/JPEG/GIF/WebP`]
  const lines = readFileSync(path, 'utf8').split('\n')
  const ruleFindings = RULES.filter(rule => rule.appliesTo(ext)).flatMap(rule =>
    lines.flatMap((line, index) =>
      rule.pattern.test(line) ? [`${rel}:${index + 1}: ${rule.name}: ${line.trim()}`] : []
    )
  )
  return [...sizeFindings, ...ruleFindings]
})

const readmeWords = readFileSync(join(PLUGIN, 'README.md'), 'utf8').split(/\s+/).filter(Boolean)
const manifest: unknown = JSON.parse(
  readFileSync(join(PLUGIN, '.claude-plugin/plugin.json'), 'utf8')
)
const has = (key: string): boolean =>
  typeof manifest === 'object' &&
  manifest !== null &&
  key in manifest &&
  typeof (manifest as Record<string, unknown>)[key] === 'string'

const listing = [
  ...(readmeWords.length < 40 ? ['plugins/randsum/README.md: fewer than 40 words'] : []),
  ...(['license', 'version'] as const)
    .filter(key => !has(key))
    .map(key => `plugins/randsum/.claude-plugin/plugin.json: no \`${key}\``)
]

const all = [...findings, ...listing]
if (all.length > 0) {
  console.error('Plugin scan guard: the directory would warn on these.')
  for (const finding of all) console.error(`  ${finding}`)
  process.exit(1)
}
console.log('Plugin scan guard passed: no directory scan patterns in plugins/randsum.')

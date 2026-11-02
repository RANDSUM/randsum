#!/usr/bin/env bun

/**
 * Plugin Version Guard: a plugin change must bump its version
 *
 * Usage: bun run check:plugin-version            # compares against origin/main
 *        bun run check:plugin-version <base-ref>
 *
 * plugins/randsum/.claude-plugin/plugin.json sets `version`, and Claude Code
 * keeps installed users on that version until it changes. A merge that touches
 * plugins/randsum/ without bumping it would never reach anyone, so this check
 * fails when the plugin folder differs from the merge base while the version
 * does not. It needs the base ref's history, so the CI job checks out with
 * full depth.
 *
 * Exit codes: 0 — plugin unchanged, version bumped, or no base version yet;
 * 1 — plugin changed without a bump, or git failed.
 */

const PLUGIN_DIR = 'plugins/randsum'
const MANIFEST = `${PLUGIN_DIR}/.claude-plugin/plugin.json`
const base = process.argv[2] ?? 'origin/main'

function git(args: readonly string[]): string | undefined {
  const result = Bun.spawnSync(['git', ...args], { stderr: 'pipe' })
  return result.exitCode === 0 ? result.stdout.toString() : undefined
}

function versionOf(source: string | undefined): string | undefined {
  if (source === undefined) return undefined
  const parsed: unknown = JSON.parse(source)
  if (typeof parsed === 'object' && parsed !== null && 'version' in parsed) {
    return typeof parsed.version === 'string' ? parsed.version : undefined
  }
  return undefined
}

const mergeBase = git(['merge-base', base, 'HEAD'])?.trim()
if (mergeBase === undefined) {
  console.error(`check:plugin-version: cannot find a merge base with ${base}. Fetch it first.`)
  process.exit(1)
}

const changed = (git(['diff', '--name-only', mergeBase, '--', PLUGIN_DIR]) ?? '')
  .split('\n')
  .filter(line => line.length > 0)

const before = versionOf(git(['show', `${mergeBase}:${MANIFEST}`]))
const after = versionOf(await Bun.file(MANIFEST).text())

if (changed.length === 0 || before === undefined || before !== after) {
  console.log(
    changed.length === 0
      ? 'Plugin unchanged.'
      : `Plugin changed; version ${before ?? '(none)'} -> ${after ?? '(none)'}.`
  )
  process.exit(0)
}

console.error(
  `${PLUGIN_DIR}/ changed (${changed.length} file${changed.length === 1 ? '' : 's'}) but ${MANIFEST} is still version ${after}. ` +
    'Installed users stay on that version until it changes: bump `version` in plugin.json.'
)
process.exit(1)

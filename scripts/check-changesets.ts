#!/usr/bin/env bun

/**
 * Changeset Guard: engine releases must release @randsum/mcp
 *
 * Usage: bun run check:changesets
 *
 * @randsum/mcp bundles @randsum/roller and @randsum/games into its own dist
 * (workspace devDependencies + bunup `noExternal`). Changesets never releases a
 * package because a devDependency changed, so a roller or games release leaves
 * mcp on npm shipping the old engine until someone remembers a manual mcp
 * changeset (audit rel-mcp-never-bumped). Putting mcp in `fixed` would drag it
 * onto the engine's version line, so this check asks for the changeset instead.
 *
 * It reads the frontmatter of the pending `.changeset/*.md` files directly
 * rather than `changeset status`, which also diffs against the base branch and
 * so needs full git history the CI checkout does not have.
 *
 * Exit codes: 0 — no engine release pending, or mcp is released too; 1 — not.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CHANGESET_DIR = join(import.meta.dir, '..', '.changeset')
const ENGINE = new Set(['@randsum/roller', '@randsum/games'])
const BUNDLER = '@randsum/mcp'

/** Packages a changeset file releases, i.e. its frontmatter entries other than `none`. */
function releasedPackages(source: string): readonly string[] {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? ''
  return frontmatter.split(/\r?\n/).flatMap(line => {
    const entry = /^\s*['"]?([^'":\s]+)['"]?\s*:\s*(major|minor|patch)\s*$/.exec(line)
    return entry?.[1] ? [entry[1]] : []
  })
}

const released = new Set(
  readdirSync(CHANGESET_DIR)
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .flatMap(file => releasedPackages(readFileSync(join(CHANGESET_DIR, file), 'utf8')))
)

const engineReleases = [...released].filter(name => ENGINE.has(name))

if (engineReleases.length > 0 && !released.has(BUNDLER)) {
  console.error(
    `Pending changesets release ${engineReleases.join(' and ')} but not ${BUNDLER}, which ` +
      `bundles them. Add a changeset that releases ${BUNDLER} (a patch is enough) so npm ` +
      'users get the new engine: bun run changeset'
  )
  process.exit(1)
}

console.log(
  engineReleases.length > 0
    ? `Pending engine releases (${engineReleases.join(', ')}) include ${BUNDLER}.`
    : 'No pending roller or games release.'
)

#!/usr/bin/env bun

/**
 * Notation Spec Mirror Check
 *
 * Usage: bun scripts/check-notation-mirror.ts [dir]
 *
 * Runs the notation-spec mirror's own CI (scripts/notation-spec-mirror/.github/
 * workflows/ci.yml: `bun install`, then `bun run check`) on a mirror tree, so
 * the monorepo cannot sync a commit that the mirror's required `check` would
 * fail. With no <dir> it writes a fresh tree to a temporary directory with
 * scripts/sync-notation-spec.ts and removes it afterwards. The sync workflow
 * passes the tree it is about to push.
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { $ } from 'bun'

const given = process.argv[2]
const dir =
  given === undefined ? mkdtempSync(join(tmpdir(), 'notation-spec-mirror-')) : resolve(given)

try {
  if (given === undefined) await $`bun ${join(import.meta.dir, 'sync-notation-spec.ts')} ${dir}`
  await $`bun install`.cwd(dir)
  await $`bun run check`.cwd(dir)
  console.warn(`The notation-spec mirror passes its check (${dir}).`)
} catch (error) {
  console.error('The notation-spec mirror fails its own CI check; fix it before it syncs.')
  process.exitCode = 1
  if (error instanceof Error && !('exitCode' in error)) console.error(error)
} finally {
  if (given === undefined) rmSync(dir, { recursive: true, force: true })
}

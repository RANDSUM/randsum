/**
 * ESM-only verification for all publishable @randsum packages.
 * Asserts no CJS artifacts exist in dist directories.
 * Per ADR-008: ESM-only enables reliable tree-shaking.
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const WORKTREE_ROOT = join(import.meta.dir, '../../..')

const PUBLISHABLE_PACKAGES = ['packages/roller', 'packages/games'] as const

function collectDistFiles(pkgPath: string): string[] {
  const distPath = join(WORKTREE_ROOT, pkgPath, 'dist')
  if (!existsSync(distPath)) {
    return []
  }
  const results: string[] = []
  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        results.push(fullPath)
      }
    }
  }
  walk(distPath)
  return results
}

describe('ESM-only dist output', () => {
  for (const pkg of PUBLISHABLE_PACKAGES) {
    describe(pkg, () => {
      test('no .cjs files in dist', () => {
        const files = collectDistFiles(pkg)
        const cjsFiles = files.filter(f => f.endsWith('.cjs'))
        expect(cjsFiles).toEqual([])
      })

      test('no .d.cts files in dist', () => {
        const files = collectDistFiles(pkg)
        const dCtsFiles = files.filter(f => f.endsWith('.d.cts'))
        expect(dCtsFiles).toEqual([])
      })

      test('no require condition in package.json exports', async () => {
        const pkgJsonPath = join(WORKTREE_ROOT, pkg, 'package.json')
        const pkgJson = await import(pkgJsonPath)
        const exports = pkgJson.default?.exports ?? pkgJson.exports ?? {}
        const raw = JSON.stringify(exports)
        expect(raw).not.toContain('"require"')
      })
    })
  }
})

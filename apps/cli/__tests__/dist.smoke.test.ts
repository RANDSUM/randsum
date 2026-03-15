/**
 * Dist smoke test for @randsum/cli
 * Runs the built CLI binary to verify it works.
 * Run `bun run --filter @randsum/cli build` before this test.
 */
import { describe, expect, test } from 'bun:test'
import { resolve } from 'path'

const cliDist = resolve(import.meta.dir, '..', 'dist', 'index.js')
const cwd = resolve(import.meta.dir, '..', '..', '..')

describe('@randsum/cli (dist)', () => {
  test('CLI bin entry runs and exits with code 0', () => {
    const result = Bun.spawnSync(['bun', 'run', cliDist, '2d6'], { cwd })
    expect(result.exitCode).toBe(0)
    const stdout = result.stdout.toString().trim()
    expect(stdout).toMatch(/\d+/)
  })
})

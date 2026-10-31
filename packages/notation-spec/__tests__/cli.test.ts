import { beforeAll, describe, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'

const root = new URL('../', import.meta.url).pathname
const cli = `${root}dist/cli.js`

// The bin as it ships: node running dist/cli.js against an adapter process.
describe('rdn-conformance', () => {
  beforeAll(() => {
    if (!existsSync(cli)) Bun.spawnSync(['bun', 'run', 'build'], { cwd: root })
  })

  const run = (...args: string[]): { code: number; out: string } => {
    const proc = Bun.spawnSync(['node', cli, ...args], { cwd: root })
    return { code: proc.exitCode, out: new TextDecoder().decode(proc.stdout) }
  }

  test('proves Level 4 for the reference adapter', () => {
    const { code, out } = run('--level', '4', '--', 'bun', 'examples/randsum-roller/adapter.ts')
    expect(out).toContain('RDN 0.9.0 Level 4 (Full) conformant.')
    expect(out).toContain('https://notation.randsum.dev/badges/v0.9.0/level-4.svg')
    expect(code).toBe(0)
  })

  test('--json prints the report', () => {
    const { code, out } = run('--json', '--', 'bun', 'examples/randsum-roller/adapter.ts')
    expect(JSON.parse(out)).toMatchObject({ specVersion: '0.9.0', highestLevel: 4 })
    expect(code).toBe(0)
  })

  test('the skeleton adapter answers every vector with an error and reaches no level', () => {
    const { code, out } = run('--', 'python3', 'examples/skeleton/adapter.py')
    expect(out).toContain('No level reached')
    expect(code).toBe(1)
  })

  test('an adapter that exits fails every vector instead of hanging', () => {
    const { code, out } = run('--timeout', '2000', '--', 'node', '-e', 'process.exit(0)')
    expect(out).toContain('0/')
    expect(code).toBe(1)
  })

  test('no adapter command is a usage error', () => {
    expect(run().code).toBe(2)
  })
})

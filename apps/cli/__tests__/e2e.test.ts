/**
 * End-to-end tests for @randsum/cli.
 *
 * The CLI is a plain string-formatting tool with NO interactive TTY UI (no Ink, no
 * raw-mode rendering) — see docs/adr/ADR-019. Per the X1 remediation item, the
 * appropriate e2e for this shape is a real process-spawn that drives the built binary
 * and asserts the rendered stdout for a known seed. Output is deterministic because the
 * CLI's `--seed` flag swaps in a seeded LCG (`createSeededRandom` in src/run.ts), so we
 * can snapshot exact strings rather than only shape-match.
 *
 * Run `bun run --filter @randsum/cli build` before this test (the dist smoke test has the
 * same prerequisite). The spawn targets the published entry (`dist/index.js`) so this
 * exercises the actual shipped artifact, not the source.
 */
import { describe, expect, test } from 'bun:test'
import { resolve } from 'node:path'

const cliDist = resolve(import.meta.dir, '..', 'dist', 'index.js')
const repoRoot = resolve(import.meta.dir, '..', '..', '..')

interface RunResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number | null
}

function runCli(args: readonly string[], stdin?: string): RunResult {
  const result = Bun.spawnSync(['node', cliDist, ...args], {
    cwd: repoRoot,
    stdin: stdin === undefined ? 'ignore' : new TextEncoder().encode(stdin)
  })
  return {
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
    exitCode: result.exitCode
  }
}

describe('@randsum/cli e2e (built binary)', () => {
  test('seeded compact roll renders deterministic stdout', () => {
    const { stdout, exitCode } = runCli(['4d6L', '--seed', '42'])
    expect(exitCode).toBe(0)
    expect(stdout).toBe('8  [2, 2, 4]  Drop lowest')
  })

  test('seeded JSON output renders deterministic stdout', () => {
    const { stdout, exitCode } = runCli(['2d6', '--seed', '42', '--json'])
    expect(exitCode).toBe(0)
    const parsed = JSON.parse(stdout) as { total: number; rolls: { raw: number[] }[] }
    expect(parsed.total).toBe(3)
    expect(parsed.rolls[0]?.raw).toEqual([2, 1])
  })

  test('seeded verbose output includes the labeled breakdown', () => {
    const { stdout, exitCode } = runCli(['1d20', '--seed', '7', '-v'])
    expect(exitCode).toBe(0)
    expect(stdout).toBe(['Roll:  Roll 1 20-sided die', 'Raw:   [5]', 'Total: 5'].join('\n'))
  })

  test('--repeat with a seed renders N deterministic lines (RNG advances each roll)', () => {
    const { stdout, exitCode } = runCli(['4d6L', '--seed', '42', '-r', '3'])
    expect(exitCode).toBe(0)
    // The seeded LCG is created once and advances across iterations, so each repeat
    // line is distinct but fully reproducible.
    expect(stdout).toBe(
      ['8  [2, 2, 4]  Drop lowest', '7  [1, 3, 3]  Drop lowest', '18  [6, 6, 6]  Drop lowest'].join(
        '\n'
      )
    )
  })

  test('reads notation from non-TTY stdin when no args are given', () => {
    // When stdin is piped (not a TTY) and no notation args are present, the CLI reads
    // notation from stdin. This drives the binary the way a shell pipe would.
    const { stdout, exitCode } = runCli(['--seed', '42'], '4d6L\n')
    expect(exitCode).toBe(0)
    expect(stdout).toBe('8  [2, 2, 4]  Drop lowest')
  })

  test('invalid notation exits non-zero and writes to stderr', () => {
    const { stderr, exitCode } = runCli(['not-a-roll'])
    expect(exitCode).toBe(1)
    expect(stderr).toContain('Error:')
  })

  test('--help exits 0 and prints usage', () => {
    const { stdout, exitCode } = runCli(['--help'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Usage: randsum')
  })
})

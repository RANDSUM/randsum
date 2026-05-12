import type { RollArgument, RollConfig } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { formatCompact, formatJson, formatVerbose } from './format'

interface RunOptions {
  readonly notations: readonly string[]
  readonly verbose: boolean
  readonly json: boolean
  readonly repeat: number
  readonly seed?: number | undefined
}

export interface RunResult {
  readonly stdout: string
  readonly stderr: string
  readonly hadError: boolean
}

function createSeededRandom(seed: number): () => number {
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32
  const state = { value: seed }
  return (): number => {
    state.value = (a * state.value + c) % m
    return state.value / m
  }
}

export function runRolls(options: RunOptions): RunResult {
  const config: RollConfig | undefined =
    options.seed !== undefined ? { randomFn: createSeededRandom(options.seed) } : undefined

  const format = options.json ? formatJson : options.verbose ? formatVerbose : formatCompact

  const stdoutLines: string[] = []
  const stderrLines: string[] = []

  const notations = options.notations as readonly RollArgument[]

  for (const _i of Array.from({ length: options.repeat })) {
    try {
      const result = config ? roll(...notations, config) : roll(...notations)
      stdoutLines.push(format(result))
    } catch (e) {
      stderrLines.push(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return {
    stdout: stdoutLines.join('\n'),
    stderr: stderrLines.join('\n'),
    hadError: stderrLines.length > 0
  }
}

import type { RollArgument, RollConfig } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { formatCompact, formatJson, formatVerbose } from '../shared/format'

interface SimpleOptions {
  readonly notations: readonly string[]
  readonly verbose: boolean
  readonly json: boolean
  readonly repeat: number
  readonly seed?: number | undefined
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

export function runSimple(options: SimpleOptions): string {
  const config: RollConfig | undefined =
    options.seed !== undefined ? { randomFn: createSeededRandom(options.seed) } : undefined

  const format = options.json ? formatJson : options.verbose ? formatVerbose : formatCompact

  const lines: string[] = []

  const notations = options.notations as readonly RollArgument[]

  for (const _i of Array.from({ length: options.repeat })) {
    const result = config ? roll(...notations, config) : roll(...notations)
    lines.push(format(result))
  }

  return lines.join('\n')
}

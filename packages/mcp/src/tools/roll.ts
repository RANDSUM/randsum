import type { RollArgument, RollConfig } from '@randsum/roller'
import { suggestNotationFix } from '@randsum/roller'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { createSeededRandom } from '../rng'

/** Input for the `roll` tool handler. */
export interface RollToolInput {
  readonly notation: string
  readonly seed?: number | undefined
}

/** Result for a single dice pool within a roll. */
export interface RollPoolResult {
  readonly notation: string
  readonly rolls: readonly number[]
  readonly total: number
  readonly description: string
}

/** Structured result returned by the `roll` tool handler. */
export interface RollToolResult {
  readonly notation: string
  readonly total: number
  readonly pools: readonly RollPoolResult[]
  readonly description: string
}

/**
 * Rolls dice from RANDSUM notation, optionally with a deterministic seed.
 *
 * Throws with a suggestion when the notation is invalid.
 */
export function rollNotation(input: RollToolInput): RollToolResult {
  if (!isDiceNotation(input.notation)) {
    const suggestion = suggestNotationFix(input.notation)
    const base = `Invalid dice notation: "${input.notation}"`
    throw new Error(suggestion ? `${base}. Did you mean \`${suggestion}\`?` : base)
  }

  const config: RollConfig | undefined =
    input.seed !== undefined ? { randomFn: createSeededRandom(input.seed) } : undefined

  const argument = input.notation as RollArgument
  const result = config ? roll(argument, config) : roll(argument)

  const pools: RollPoolResult[] = result.rolls.map(record => ({
    notation: record.notation,
    rolls: record.rolls,
    total: record.total,
    description: record.description.join(', ')
  }))

  return {
    notation: input.notation,
    total: result.total,
    pools,
    description: pools.map(pool => pool.description).join('; ')
  }
}

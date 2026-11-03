import type { RollArgument, RollConfig, RollRecord } from '@randsum/roller'
import { suggestNotationFix } from '@randsum/roller'
import { ERROR_CODES, RandsumError } from '@randsum/roller/errors'
import { roll } from '@randsum/roller/roll'
import { isDiceNotation } from '@randsum/roller/validate'
import { createSeededRandom } from '@randsum/roller/random'

/** Input for the `roll` tool handler. */
export interface RollToolInput {
  readonly notation: string
  readonly seed?: number | undefined
}

/** Result for a single dice pool within a roll. */
export interface RollPoolResult {
  readonly notation: string
  /** Every die as first rolled, before modifiers: dropped and rerolled dice included. */
  readonly initialRolls: readonly number[]
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
  return rollNotationWithRecords(input).result
}

/**
 * `rollNotation`, plus the roller's full record of each pool: every die
 * before and after each modifier. The MCP tool hands the records to its UI
 * view, which draws the steps; the model and the REST API get only the result.
 */
export function rollNotationWithRecords(input: RollToolInput): {
  readonly result: RollToolResult
  readonly records: readonly RollRecord[]
} {
  if (!isDiceNotation(input.notation)) {
    const suggestion = suggestNotationFix(input.notation)
    const base = `Invalid dice notation: "${input.notation}"`
    // A RandsumError, so the MCP result reports its INVALID_NOTATION code.
    throw new RandsumError(
      suggestion ? `${base}. Did you mean \`${suggestion}\`?` : base,
      ERROR_CODES.INVALID_NOTATION,
      { notation: input.notation }
    )
  }

  const config: RollConfig | undefined =
    input.seed !== undefined ? { randomFn: createSeededRandom(input.seed) } : undefined

  const argument = input.notation as RollArgument
  const result = config ? roll(argument, config) : roll(argument)

  const pools: RollPoolResult[] = result.rolls.map(record => ({
    notation: record.notation,
    initialRolls: record.initialRolls,
    rolls: record.rolls,
    total: record.total,
    description: record.description.join(', ')
  }))

  return {
    result: {
      notation: input.notation,
      total: result.total,
      pools,
      description: pools.map(pool => pool.description).join('; ')
    },
    records: result.rolls
  }
}

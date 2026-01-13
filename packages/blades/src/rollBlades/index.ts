import type { RollRecord, GameRollResult } from '@randsum/roller'
import { roll, validateInteger, validateNonNegative } from '@randsum/roller'
import { interpretHit } from './interpretHit'
import type { BladesResult } from '../types'

/**
 * Rolls dice for Blades in the Dark.
 *
 * Rolls a pool of d6s and interprets the result according to Blades mechanics:
 * - 6: Critical success
 * - 4-5: Success
 * - 1-3: Failure
 * - If pool is 0, rolls 2d6 and drops the highest (desperate action)
 *
 * @param count - Number of dice in the pool (0-10 recommended)
 * @returns Game roll result with Blades-specific interpretation
 *
 * @example
 * ```ts
 * const result = rollBlades(3) // Roll 3d6
 * console.log(result.result) // "critical", "success", or "failure"
 * ```
 *
 * @throws Error if count is not an integer, negative, or unusually large (>10)
 */
export function rollBlades(count: number): GameRollResult<BladesResult, undefined, RollRecord> {
  validateInteger(count, 'Blades dice pool')
  validateNonNegative(count, 'Blades dice pool')

  if (count > 10) {
    throw new Error(`Blades dice pool is unusually large (${count}). Maximum recommended is 10.`)
  }
  const canCrit = count > 0
  const rollResult = roll({
    sides: 6,
    quantity: canCrit ? count : 2,
    ...(canCrit
      ? {}
      : {
          modifiers: { drop: { highest: 1 } }
        })
  })
  return {
    ...rollResult,
    result: interpretHit(rollResult, canCrit)
  }
}

import { roll as coreRoll } from '@randsum/roller'
import type { BladesRollResult } from '../types'
import { generateOptions } from './generateOptions'
import { interpretHit } from './interpretHit'

/**
 * Roll dice for Blades in the Dark position and effect.
 *
 * @param count - Number of d6 dice in the pool (typically 1-4)
 * @returns Roll result with outcome and detailed roll information
 *
 * @throws {Error} When count is not a non-negative integer or exceeds 10
 *
 * @example
 * ```typescript
 * // Desperate position (1 die)
 * const desperate = rollBlades(1)
 *
 * // Risky position (2 dice)
 * const risky = rollBlades(2)
 *
 * // Controlled position (3 dice)
 * const controlled = rollBlades(3)
 *
 * // Check the result
 * switch (result.outcome) {
 *   case 'critical': // Multiple 6s
 *   case 'success':  // Highest die 4-6
 *   case 'partial':  // Highest die 1-3
 *   case 'failure':  // No dice (shouldn't happen)
 * }
 * ```
 */
export function rollBlades(count: number): BladesRollResult {
  if (!Number.isInteger(count)) {
    throw new Error(`Blades dice pool must be an integer, received: ${count}`)
  }

  if (count < 0) {
    throw new Error(`Blades dice pool must be non-negative, received: ${count}`)
  }

  if (count > 10) {
    throw new Error(
      `Blades dice pool is unusually large (${count}). Maximum recommended is 10.`
    )
  }

  const canCrit = count > 0

  const baseResult = coreRoll(generateOptions(count, canCrit))
  const rolls = baseResult.rolls
    .map((roll) => roll.modifierHistory.initialRolls.sort((a, b) => a - b))
    .flat()

  const result = interpretHit(rolls, canCrit)

  return {
    result,
    baseResult
  }
}

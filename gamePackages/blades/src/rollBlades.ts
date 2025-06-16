import {
  type NumericRollOptions,
  type NumericRollResult,
  roll
} from '@randsum/dice'
import type { BladesResult } from './types'

/**
 * Interprets the dice results according to Blades in the Dark rules
 *
 * @param sortedRolls - Array of die results sorted in ascending order
 * @param canCrit - Whether critical hits are possible (requires 2+ dice)
 * @returns The interpreted result based on Blades mechanics
 * @internal
 */
function interpretHit(sortedRolls: number[], canCrit: boolean): BladesResult {
  const sixes = sortedRolls.filter((r) => r === 6).length
  if (sixes >= 2 && canCrit) {
    return 'critical'
  }

  switch (sortedRolls[0]) {
    case 6:
      return 'success'
    case 5:
    case 4:
      return 'partial'
    default:
      return 'failure'
  }
}

/**
 * Generates roll options based on dice pool size and critical hit capability
 *
 * @param count - Number of dice in the pool
 * @param canCrit - Whether critical hits are possible
 * @returns Roll options configured for Blades mechanics
 * @internal
 */
function generateOptions(count: number, canCrit: boolean): NumericRollOptions {
  if (canCrit) {
    return { sides: 6, quantity: count }
  }
  return { sides: 6, quantity: 2, modifiers: { drop: { highest: 1 } } }
}

/**
 * Rolls dice using Blades in the Dark mechanics
 *
 * This function implements the dice pool system used in Blades in the Dark,
 * where players roll multiple d6s and interpret the results based on the
 * highest die rolled. Multiple 6s can result in critical successes.
 *
 * @param count - Number of dice to roll (dice pool size)
 *   - 0 dice: Roll 2d6, keep lowest (desperate position)
 *   - 1+ dice: Roll the specified number of d6s
 *
 * @returns A tuple containing:
 *   - The interpreted result ('critical', 'success', 'partial', or 'failure')
 *   - The detailed roll result object
 *
 * @example
 * // Desperate position (0 dice)
 * const [result] = rollBlades(0) // 'failure' or 'partial' most likely
 *
 * @example
 * // Risky position (2 dice)
 * const [result, details] = rollBlades(2)
 * // result could be 'critical', 'success', 'partial', or 'failure'
 * // details contains the actual dice rolls
 *
 * @example
 * // Controlled position (3+ dice)
 * const [result] = rollBlades(4) // Higher chance of success/critical
 */
export function rollBlades(count: number): [BladesResult, NumericRollResult] {
  const canCrit = count > 0

  const rollResult = roll(generateOptions(count, canCrit))
  const rolls = rollResult.result.flat().sort((a, b) => a - b)

  return [interpretHit(rolls, canCrit), rollResult]
}

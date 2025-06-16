/**
 * @file Main roll function for RANDSUM dice rolling
 * @module @randsum/dice/roll
 */

import type {
  CustomRollArgument,
  CustomRollResult,
  DicePool,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from './types'
import {
  generateKey,
  normalizeArgument,
  rollResultFromDicePools
} from './utils'

/**
 * Rolls dice with various options and modifiers
 *
 * This is the main function for rolling dice in the RANDSUM system. It accepts
 * multiple arguments of different types and returns detailed roll results.
 * The function is overloaded to provide type safety for different argument combinations.
 *
 * @param args - Variable number of roll arguments. Can be:
 *   - Numbers (for simple dice, e.g., 20 for a d20)
 *   - Strings (dice notation, e.g., "4d6L" for 4d6 drop lowest)
 *   - Objects (detailed roll options with modifiers)
 *   - Die instances (from the D class)
 *
 * @returns Detailed roll result object containing:
 *   - `sum`: Total value of the roll
 *   - `rolls`: Array of individual die results
 *   - `droppedRolls`: Array of dice that were dropped by modifiers
 *   - `notation`: String representation of what was rolled
 *   - `sides`: Number of sides on the dice
 *   - `quantity`: Number of dice rolled
 *
 * @example
 * // Simple numeric roll
 * roll(20) // Roll a d20
 *
 * @example
 * // Dice notation
 * roll('4d6L') // Roll 4d6, drop lowest
 * roll('2d20H') // Roll 2d20, keep highest (advantage)
 *
 * @example
 * // Multiple dice in one roll
 * roll('2d20', '4d6', '1d8') // Roll multiple dice types
 *
 * @example
 * // Complex options object
 * roll({
 *   sides: 6,
 *   quantity: 4,
 *   modifiers: {
 *     drop: { lowest: 1 },
 *     plus: 2
 *   }
 * })
 *
 * @example
 * // Using die instances
 * import { D20, D6 } from '@randsum/dice'
 * roll(D20, D6) // Roll a d20 and a d6
 */
function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
function roll(...args: RollArgument[]): RollResult {
  const dicePools: DicePool = {
    dicePools: Object.fromEntries(
      args.map((arg) => [generateKey(), normalizeArgument(arg)])
    )
  }

  return rollResultFromDicePools(dicePools)
}

export { roll }

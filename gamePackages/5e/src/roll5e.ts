import {
  type ModifierOptions,
  type NumericRollOptions,
  type NumericRollResult,
  roll
} from '@randsum/dice'
import type { AdvantageDisadvantage5e, RollArgument5e } from './types'

/**
 * Rolls a d20 with 5th Edition D&D mechanics
 *
 * This function handles the standard d20 roll mechanics used in D&D 5e,
 * including advantage (roll 2d20, keep highest), disadvantage (roll 2d20, keep lowest),
 * and normal rolls with optional modifiers.
 *
 * @param options - Roll configuration object
 * @param options.modifier - Numeric modifier to add to the roll (default: 0)
 * @param options.rollingWith - Advantage/disadvantage state (optional)
 *
 * @returns Detailed roll result with sum, individual rolls, and metadata
 *
 * @example
 * // Standard d20 roll
 * roll5e({ modifier: 5 }) // d20 + 5
 *
 * @example
 * // Roll with advantage
 * roll5e({ modifier: 3, rollingWith: 'Advantage' }) // 2d20H + 3
 *
 * @example
 * // Roll with disadvantage
 * roll5e({ modifier: -1, rollingWith: 'Disadvantage' }) // 2d20L - 1
 */
export function roll5e({
  modifier,
  rollingWith
}: RollArgument5e): NumericRollResult {
  const rollArg: NumericRollOptions = {
    sides: 20,
    quantity: generateQuantity(rollingWith),
    modifiers: { ...generateModifiers(rollingWith), plus: modifier }
  }
  return roll(rollArg)
}

/**
 * Determines the number of dice to roll based on advantage/disadvantage
 *
 * @param rollingWith - Advantage/disadvantage state
 * @returns 2 for advantage/disadvantage, 1 for normal rolls
 * @internal
 */
function generateQuantity(rollingWith?: AdvantageDisadvantage5e): 1 | 2 {
  switch (rollingWith) {
    case 'Advantage':
    case 'Disadvantage':
      return 2
    default:
      return 1
  }
}

/**
 * Generates drop modifiers for advantage/disadvantage mechanics
 *
 * @param rollingWith - Advantage/disadvantage state
 * @returns Drop modifier configuration for the roll
 * @internal
 */
function generateModifiers(
  rollingWith: AdvantageDisadvantage5e | undefined
): Pick<ModifierOptions, 'drop'> {
  switch (rollingWith) {
    case 'Advantage':
      return {
        drop: { lowest: 1 }
      }
    case 'Disadvantage':
      return {
        drop: { highest: 1 }
      }
    default:
      return { drop: {} }
  }
}

import { type NumericRollResult, roll } from '@randsum/dice'
import type { RootResult } from './types'

/**
 * Interprets a 2d6 roll result according to Root RPG rules
 *
 * @param result - The total of the 2d6 roll
 * @returns Root RPG result category
 * @internal
 */
function interpretResult(result: number): RootResult {
  switch (true) {
    case result >= 10:
      return 'Strong Hit'
    case result >= 7 && result <= 9:
      return 'Weak Hit'
    default:
      return 'Miss'
  }
}

/**
 * Rolls dice using Root RPG mechanics
 *
 * This function implements the 2d6 system used in Root RPG, where players
 * roll two six-sided dice and add a bonus. Results are interpreted as
 * Strong Hit (10+), Weak Hit (7-9), or Miss (6 or less).
 *
 * @param bonus - Numeric bonus to add to the 2d6 roll
 *
 * @returns A tuple containing:
 *   - The interpreted result ('Strong Hit', 'Weak Hit', or 'Miss')
 *   - The detailed roll result object
 *
 * @example
 * // Basic Root RPG roll
 * const [result, details] = rollRoot(3) // 2d6 + 3
 * // result could be 'Strong Hit', 'Weak Hit', or 'Miss'
 * // details contains the actual dice rolls and total
 *
 * @example
 * // High bonus roll
 * const [result] = rollRoot(5) // 2d6 + 5, likely Strong Hit
 *
 * @example
 * // No bonus roll
 * const [result] = rollRoot(0) // 2d6 + 0
 */
export function rollRoot(bonus: number): [RootResult, NumericRollResult] {
  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const result = roll(args)

  return [interpretResult(result.total), result]
}

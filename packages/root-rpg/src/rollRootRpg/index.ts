import { roll as coreRoll } from '@randsum/roller'
import type { RootRpgRollResult } from '../types'
import { interpretResult } from './interpretResult'

/**
 * Roll 2d6 for Root RPG system with modifier.
 *
 * @param bonus - Modifier to add to the 2d6 roll
 * @returns Roll result with outcome interpretation and detailed roll information
 *
 * @throws {Error} When bonus is not finite or outside reasonable range (-20 to +20)
 *
 * @example
 * ```typescript
 * // Basic roll with no modifier
 * const basic = rollRootRpg(0)
 *
 * // Roll with positive modifier
 * const skilled = rollRootRpg(3)
 *
 * // Roll with negative modifier
 * const difficult = rollRootRpg(-2)
 *
 * // Check the result
 * switch (result.outcome) {
 *   case 'Strong Hit': // 10+
 *   case 'Weak Hit':   // 7-9
 *   case 'Miss':       // 6 or less
 * }
 * ```
 */
export function rollRootRpg(bonus: number): RootRpgRollResult {
  // Input validation
  if (!Number.isFinite(bonus)) {
    throw new Error(
      `Root RPG bonus must be a finite number, received: ${bonus}`
    )
  }

  if (bonus < -20 || bonus > 20) {
    throw new Error(
      `Root RPG bonus is outside reasonable range (-20 to +20), received: ${bonus}`
    )
  }

  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const result = coreRoll(args)

  return {
    outcome: interpretResult(result.total),
    roll: result.total,
    result
  }
}

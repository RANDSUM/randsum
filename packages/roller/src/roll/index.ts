import type { RollArgument, RollResult } from '../types'
import { argToParameter } from './argToParameter'
import { generateRollResult } from './generateRollResult'

/**
 * Roll dice using flexible notation or options.
 *
 * @param arg - Dice specification as notation string, number, or options object
 * @returns Complete roll result with total, individual rolls, and history
 *
 * @example
 * ```typescript
 * // Simple d20 roll
 * roll(20)
 * roll("1d20")
 *
 * // Complex notation with modifiers
 * roll("4d6L+2")  // Roll 4d6, drop lowest, add 2
 * roll("2d20H")    // Roll 2d20, keep highest (advantage)
 *
 * // Using options object
 * roll({
 *   sides: 6,
 *   quantity: 4,
 *   modifiers: { drop: { lowest: 1 }, plus: 2 }
 * })
 * ```
 */
export function roll(arg: RollArgument): RollResult {
  const parameter = argToParameter(arg)
  return generateRollResult(parameter)
}

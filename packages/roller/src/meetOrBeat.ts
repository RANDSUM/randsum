import { roll } from './roll'
import type { MeetOrBeatResult, RollArgument } from './types'

/**
 * Roll dice and check if the result meets or beats a target number.
 *
 * @param target - The target number to meet or exceed
 * @param rollArg - Dice specification (defaults to d20)
 * @returns Object with success boolean, target, and full roll result
 *
 * @example
 * ```typescript
 * // Basic skill check against DC 15
 * const check = meetOrBeat(15, "1d20+5")
 * if (check.success) {
 *   console.log("Success!")
 * }
 *
 * // Saving throw with advantage
 * const save = meetOrBeat(12, "2d20H+3")
 * ```
 */
export function meetOrBeat(
  target: number,
  rollArg: RollArgument = { sides: 20 }
): MeetOrBeatResult {
  const result = roll(rollArg)
  return {
    success: result.total >= target,
    target,
    result
  }
}

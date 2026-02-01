import { roll, validateRange } from '@randsum/roller'
import type { GameRollResult, RollRecord } from '@randsum/roller'
import type { PbtAOutcome, PbtARollArgument, PbtARollDetails } from '../types'

/**
 * Rolls dice for Powered by the Apocalypse games.
 *
 * Standard PbtA mechanics:
 * - Roll 2d6 + stat modifier
 * - 10+ = strong hit (complete success)
 * - 7-9 = weak hit (partial success, success with cost)
 * - 6- = miss (failure)
 *
 * Supports advantage/disadvantage (roll 3d6, keep 2).
 *
 * @param arg - Roll argument containing stat and optional bonuses
 * @returns Game roll result with PbtA-specific interpretation
 *
 * @example
 * ```ts
 * const result = rollPbtA({ stat: 2, forward: 1 })
 * console.log(result.result) // "strong_hit", "weak_hit", or "miss"
 * ```
 *
 * @throws Error if stat is outside valid range (-3 to 5) or bonuses are invalid
 */
export function rollPbtA(
  arg: PbtARollArgument
): GameRollResult<PbtAOutcome, PbtARollDetails, RollRecord> {
  validateRange(arg.stat, -3, 5, 'PbtA stat')
  if (arg.forward !== undefined) {
    validateRange(arg.forward, -5, 5, 'forward bonus')
  }
  if (arg.ongoing !== undefined) {
    validateRange(arg.ongoing, -5, 5, 'ongoing bonus')
  }

  const modifier = arg.stat + (arg.forward ?? 0) + (arg.ongoing ?? 0)
  const rollResult = roll({
    quantity: arg.advantage || arg.disadvantage ? 3 : 2,
    sides: 6,
    modifiers: arg.advantage
      ? { drop: { lowest: 1 }, plus: modifier }
      : arg.disadvantage
        ? { drop: { highest: 1 }, plus: modifier }
        : { plus: modifier }
  })

  const result: PbtAOutcome =
    rollResult.total >= 10 ? 'strong_hit' : rollResult.total >= 7 ? 'weak_hit' : 'miss'

  const diceTotal = rollResult.total - arg.stat - (arg.forward ?? 0) - (arg.ongoing ?? 0)

  const details: PbtARollDetails = {
    stat: arg.stat,
    forward: arg.forward ?? 0,
    ongoing: arg.ongoing ?? 0,
    diceTotal
  }

  return {
    rolls: rollResult.rolls,
    total: rollResult.total,
    result,
    details
  }
}

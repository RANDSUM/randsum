import { createGameRoll, validateFinite, validateRange } from '@randsum/roller'
import type { GameRollResult, RollRecord } from '@randsum/roller'
import type { FifthRollArgument, FifthRollResult } from '../types'
import { generateQuantity } from './generateQuantity'
import { generateModifiers } from './generateModifiers'

/**
 * Rolls a D&D 5th Edition action roll (d20 + modifier).
 *
 * Supports advantage (roll 2d20, keep highest) and disadvantage (roll 2d20, keep lowest).
 * If both advantage and disadvantage are specified, they cancel out to a normal roll.
 *
 * @param arg - Roll argument containing modifier and optional advantage/disadvantage
 * @returns Game roll result with total (d20 result + modifier)
 *
 * @example Basic roll
 * ```ts
 * const result = actionRoll({ modifier: 5 })
 * // Rolls 1d20 + 5
 * result.total // => e.g., 18
 * ```
 *
 * @example With advantage
 * ```ts
 * const result = actionRoll({
 *   modifier: 3,
 *   rollingWith: { advantage: true }
 * })
 * // Rolls 2d20, keeps highest, adds 3
 * ```
 *
 * @throws Error if modifier is not a finite number or outside reasonable range (-30 to +30)
 */
export const actionRoll: (
  arg: FifthRollArgument
) => GameRollResult<FifthRollResult, undefined, RollRecord> = createGameRoll<
  FifthRollArgument,
  FifthRollResult
>({
  validate: (arg: FifthRollArgument) => {
    validateFinite(arg.modifier, '5E modifier')
    validateRange(arg.modifier, -30, 30, '5E modifier')
  },
  toRollOptions: (arg: FifthRollArgument) => ({
    sides: 20,
    quantity: generateQuantity(arg.rollingWith),
    modifiers: { ...generateModifiers(arg.rollingWith), plus: arg.modifier }
  }),
  interpretResult: (_input: FifthRollArgument, total: number) => total
})

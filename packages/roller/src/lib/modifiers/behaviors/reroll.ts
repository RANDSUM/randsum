import type { RerollOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import { matchesComparison, validateComparisonOptions } from '../../comparison'
import { MAX_REROLL_ATTEMPTS } from '../../constants'
import type { ModifierBehavior } from '../schema'
import { assertRollFn } from '../schema'

function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= MAX_REROLL_ATTEMPTS) {
    return roll
  }

  if (matchesComparison(roll, options)) {
    return rerollSingle(rollOne(), options, rollOne, attempt + 1)
  }

  return roll
}

export const rerollBehavior: ModifierBehavior<RerollOptions> = {
  requiresRollFn: true,

  apply: (rolls, options, ctx) => {
    const { rollOne } = assertRollFn(ctx)
    const { max } = options

    const { result } = rolls.reduce<{ result: number[]; rerollCount: number }>(
      (acc, roll) => {
        if (max !== undefined && acc.rerollCount >= max) {
          return { result: [...acc.result, roll], rerollCount: acc.rerollCount }
        }

        const newRoll = rerollSingle(roll, options, rollOne)
        const didReroll = newRoll !== roll
        return {
          result: [...acc.result, newRoll],
          rerollCount: didReroll ? acc.rerollCount + 1 : acc.rerollCount
        }
      },
      { result: [], rerollCount: 0 }
    )

    return { rolls: result }
  },

  validate: (options, { sides }) => {
    if (options.exact) {
      for (const value of options.exact) {
        if (value < 1 || value > sides) {
          throw new ModifierError(
            'reroll',
            `Reroll value ${value} is outside valid range [1, ${sides}]`
          )
        }
      }
    }

    validateComparisonOptions('reroll', options)
  }
}

import type { RerollOptions } from '../notation/types'
import { rerollSchema } from '../notation/definitions/reroll'
import { ModifierError } from '../errors'
import { matchesComparison, validateComparisonOptions } from '../lib/comparison'
import { MAX_REROLL_ATTEMPTS } from '../lib/constants'
import type { ModifierDefinition } from './schema'
import { assertRollFn } from './schema'

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

export const rerollModifier: ModifierDefinition<RerollOptions> = {
  ...rerollSchema,
  requiresRollFn: true,

  apply: (rolls, options, ctx) => {
    const { rollOne } = assertRollFn(ctx)
    const { max } = options

    // Linear single-pass accumulation: push into one array instead of
    // spread-copying the accumulator each iteration (was O(n²)).
    // A reroll happens iff a replacement is recorded, so the reroll count
    // equals replacements.length — no separate counter needed.
    const result: number[] = []
    const replacements: { from: number; to: number }[] = []

    for (const roll of rolls) {
      if (max !== undefined && replacements.length >= max) {
        result.push(roll)
        continue
      }

      const newRoll = rerollSingle(roll, options, rollOne)
      if (newRoll !== roll) {
        replacements.push({ from: roll, to: newRoll })
      }
      result.push(newRoll)
    }

    return { rolls: result, replacements }
  },

  validate: (options, { sides }) => {
    if (options.exact) {
      for (const value of options.exact) {
        if (value < 1 || value > sides) {
          throw new ModifierError(
            'reroll',
            `Reroll value ${value} is outside valid range [1, ${sides}]`,
            { path: 'modifiers.reroll.exact', value }
          )
        }
      }
    }

    validateComparisonOptions('reroll', options)
  }
}

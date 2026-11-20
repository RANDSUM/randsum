import type { RerollOptions } from '../notation/types'
import { rerollSchema } from '../notation/definitions/reroll'
import { ModifierError } from '../errors'
import { matchesComparison } from '../lib/comparison'
import { MAX_REROLL_ATTEMPTS } from '../lib/constants'
import type { ModifierDefinition } from './schema'

function rerollSingle(
  roll: number,
  options: RerollOptions,
  rollOne: () => number,
  attempt = 0
): number {
  if (attempt >= (options.once ? 1 : MAX_REROLL_ATTEMPTS)) {
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
    const { rollOne } = ctx
    const { max } = options

    // `max` limits the dice rerolled, taken in pool order. A die counts once it
    // has been rerolled, whether or not its value changed.
    const result: number[] = []
    const replacements: { from: number; to: number }[] = []
    const rerolled = { count: 0 }

    for (const roll of rolls) {
      if (max !== undefined && rerolled.count >= max) {
        result.push(roll)
        continue
      }

      if (matchesComparison(roll, options)) rerolled.count += 1
      const newRoll = rerollSingle(roll, options, rollOne)
      if (newRoll !== roll) {
        replacements.push({ from: roll, to: newRoll })
      }
      result.push(newRoll)
    }

    return { rolls: result, replacements }
  },

  validate: (options, { sides, faces }) => {
    for (const value of options.exact ?? []) {
      const onDie = faces ? faces.includes(value) : value >= 1 && value <= sides
      if (!onDie) {
        const range = faces ? `{${faces.join(',')}}` : `[1, ${sides}]`
        throw new ModifierError('reroll', `Reroll value ${value} is outside valid range ${range}`, {
          path: 'modifiers.reroll.exact',
          value
        })
      }
    }
    // Conditions in a list are alternatives (RDN 5.2), so `R{<2,>5}` is a valid
    // "reroll low or high", not a contradiction.
  }
}

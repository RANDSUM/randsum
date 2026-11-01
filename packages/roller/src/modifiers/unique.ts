import type { UniqueOptions } from '../notation/types'
import { uniqueSchema } from '../notation/definitions/unique'
import { ModifierError } from '../errors'
import { MAX_REROLL_ATTEMPTS } from '../lib/constants'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'

export const uniqueModifier: ModifierDefinition<boolean | UniqueOptions> = {
  ...uniqueSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { rollOne } = assertRequiredContext(ctx)

    const exceptions = new Set(typeof options === 'object' ? options.notUnique : [])

    const rerollUntilUnique = (value: number, seen: Set<number>): number => {
      const findUnique = (current: number, attempts: number): number => {
        if (attempts >= MAX_REROLL_ATTEMPTS) {
          throw new ModifierError(
            'unique',
            `Could not find a unique value after ${MAX_REROLL_ATTEMPTS} attempts`
          )
        }
        // An exempt value may repeat, so a reroll that lands on one is kept.
        if (exceptions.has(current) || !seen.has(current)) return current
        return findUnique(rollOne(), attempts + 1)
      }
      return findUnique(value, 0)
    }

    // Linear single-pass accumulation: one persistent Set and push into a
    // single result array, instead of cloning the Set and spread-copying the
    // accumulator each iteration (was O(n²)).
    const result: number[] = []
    const seen = new Set<number>()
    const replacements: { from: number; to: number }[] = []

    for (const value of rolls) {
      if (exceptions.has(value)) {
        result.push(value)
        continue
      }

      if (seen.has(value)) {
        const newValue = rerollUntilUnique(value, seen)
        seen.add(newValue)
        result.push(newValue)
        replacements.push({ from: value, to: newValue })
        continue
      }

      seen.add(value)
      result.push(value)
    }

    return { rolls: result, replacements }
  },

  validate: (options, { sides, quantity, faces }) => {
    // A pool can be unique only if it has a face for every die. An exempt value
    // that is one of the die's faces may repeat, so it lifts that limit; an
    // exempt value the die cannot show does not.
    const distinct = new Set(faces ?? Array.from({ length: sides }, (_, i) => i + 1))
    const exempt = typeof options === 'object' ? options.notUnique : []
    if (exempt.some(value => distinct.has(value))) return

    if (quantity > distinct.size) {
      const unit = faces === undefined ? 'sides' : 'distinct faces'
      throw new ModifierError(
        'unique',
        `Cannot have ${quantity} unique values with only ${distinct.size} ${unit}`,
        { path: 'modifiers.unique', value: options }
      )
    }
  }
}

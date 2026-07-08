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
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides, quantity } = parameters

    if (quantity > sides) {
      throw new ModifierError(
        'unique',
        'Cannot have more rolls than sides when unique is enabled',
        { path: 'modifiers.unique', value: { quantity, sides } }
      )
    }

    const exceptions = new Set(typeof options === 'object' ? options.notUnique : [])

    const rerollUntilUnique = (value: number, seen: Set<number>): number => {
      const findUnique = (current: number, attempts: number): number => {
        if (attempts >= MAX_REROLL_ATTEMPTS) {
          throw new ModifierError(
            'unique',
            `Could not find a unique value after ${MAX_REROLL_ATTEMPTS} attempts`
          )
        }
        if (!seen.has(current) && !exceptions.has(current)) return current
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

  validate: (options, { sides, quantity }) => {
    const exceptionCount = typeof options === 'object' ? options.notUnique.length : 0
    const neededUnique = quantity - exceptionCount

    if (neededUnique > sides) {
      throw new ModifierError(
        'unique',
        `Cannot have ${neededUnique} unique values with only ${sides} sides`,
        { path: 'modifiers.unique', value: options }
      )
    }
  }
}

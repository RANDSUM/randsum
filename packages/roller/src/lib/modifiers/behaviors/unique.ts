import type { UniqueOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import { MAX_REROLL_ATTEMPTS } from '../../constants'
import type { ModifierBehavior } from '../schema'
import { assertRequiredContext } from '../schema'

export const uniqueBehavior: ModifierBehavior<boolean | UniqueOptions> = {
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides, quantity } = parameters

    if (quantity > sides) {
      throw new ModifierError('unique', 'Cannot have more rolls than sides when unique is enabled')
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

    const { result } = rolls.reduce<{ result: number[]; seen: Set<number> }>(
      (acc, value) => {
        if (exceptions.has(value)) {
          return { result: [...acc.result, value], seen: acc.seen }
        }

        if (acc.seen.has(value)) {
          const newValue = rerollUntilUnique(value, acc.seen)
          const newSeen = new Set(acc.seen).add(newValue)
          return { result: [...acc.result, newValue], seen: newSeen }
        }

        const newSeen = new Set(acc.seen).add(value)
        return { result: [...acc.result, value], seen: newSeen }
      },
      { result: [], seen: new Set<number>() }
    )

    return { rolls: result }
  },

  validate: (options, { sides, quantity }) => {
    const exceptionCount = typeof options === 'object' ? options.notUnique.length : 0
    const neededUnique = quantity - exceptionCount

    if (neededUnique > sides) {
      throw new ModifierError(
        'unique',
        `Cannot have ${neededUnique} unique values with only ${sides} sides`
      )
    }
  }
}

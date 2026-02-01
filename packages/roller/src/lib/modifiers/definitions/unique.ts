import { ModifierError } from '../../../errors'
import { MAX_REROLL_ATTEMPTS } from '../../constants'
import { formatHumanList } from '../../utils'
import type { TypedModifierDefinition } from '../schema'
import { assertRequiredContext } from '../schema'
import { defineModifier } from '../registry'

const uniquePattern = /[Uu](?:\{([^}]{1,50})\})?/

/**
 * Unique modifier - ensures all dice show different values.
 *
 * Notation: U or U{exceptions}
 * Examples:
 *   - 4d6U - All dice must show different values
 *   - 4d6U{1} - All dice unique except 1s (1s can repeat)
 */
export const uniqueModifier: TypedModifierDefinition<'unique'> = defineModifier<'unique'>({
  name: 'unique',
  priority: 60,
  requiresRollFn: true,
  requiresParameters: true,

  pattern: uniquePattern,

  parse: notation => {
    const match = uniquePattern.exec(notation)
    if (!match) return {}

    if (!match[1]) {
      return { unique: true }
    }

    const exceptions = match[1]
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n))

    return { unique: { notUnique: exceptions } }
  },

  toNotation: options => {
    if (options === true) return 'U'
    if (typeof options === 'object') {
      return `U{${options.notUnique.join(',')}}`
    }
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['No Duplicate Rolls']
    if (typeof options === 'object') {
      return [`No Duplicates (except ${formatHumanList(options.notUnique)})`]
    }
    return []
  },

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides, quantity } = parameters

    if (quantity > sides) {
      throw new ModifierError('unique', 'Cannot have more rolls than sides when unique is enabled')
    }

    const exceptions = new Set(typeof options === 'object' ? options.notUnique : [])

    const rerollUntilUnique = (value: number, seen: Set<number>): number => {
      const findUnique = (current: number, attempts: number): number => {
        if (attempts >= MAX_REROLL_ATTEMPTS) return current
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
})

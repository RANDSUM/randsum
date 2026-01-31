import { ModifierError } from '../../../errors'
import { formatHumanList } from '../../comparisonUtils'
import type { TypedModifierDefinition } from '../schema'
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

    // No braces = simple unique
    if (!match[1]) {
      return { unique: true }
    }

    // Parse exceptions
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
    // These are guaranteed by requires* flags
    const rollOne = ctx.rollOne as () => number
    const { sides, quantity } = ctx.parameters as { sides: number; quantity: number }

    // Check feasibility
    if (quantity > sides) {
      throw new ModifierError('unique', 'Cannot have more rolls than sides when unique is enabled')
    }

    const exceptions = new Set(typeof options === 'object' ? options.notUnique : [])

    const result = [...rolls]
    const seen = new Set<number>()
    const MAX_ATTEMPTS = 99

    for (let i = 0; i < result.length; i++) {
      const value = result[i]
      if (value === undefined) continue

      // If it's an exception, we don't need it to be unique
      if (exceptions.has(value)) {
        continue
      }

      // If we've seen this value, reroll it
      if (seen.has(value)) {
        let attempts = 0
        let newValue = value

        while ((seen.has(newValue) || exceptions.has(newValue)) && attempts < MAX_ATTEMPTS) {
          newValue = rollOne()
          attempts++
        }

        result[i] = newValue
        seen.add(newValue)
      } else {
        seen.add(value)
      }
    }

    return { rolls: result }
  },

  validate: (options, { sides, quantity }) => {
    // Calculate how many unique values are needed
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

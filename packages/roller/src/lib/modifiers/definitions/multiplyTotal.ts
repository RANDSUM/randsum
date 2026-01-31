import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

// Total multiply: **N (double asterisk)
const multiplyTotalPattern = /\*\*(\d+)/

/**
 * Multiply Total modifier - multiplies the final total by a value (after arithmetic).
 *
 * Notation: **N (double asterisk)
 * Examples:
 *   - 2d6**2 - Roll 2d6, multiply final total by 2
 *   - 2d6+3**2 - (2d6 + 3) * 2
 */
export const multiplyTotalModifier: TypedModifierDefinition<'multiplyTotal'> =
  defineModifier<'multiplyTotal'>({
    name: 'multiplyTotal',
    priority: 100, // After all arithmetic

    pattern: multiplyTotalPattern,

    parse: notation => {
      const match = multiplyTotalPattern.exec(notation)
      if (!match) return {}

      return { multiplyTotal: Number(match[1]) }
    },

    toNotation: options => {
      return `**${options}`
    },

    toDescription: options => {
      return [`Multiply total by ${options}`]
    },

    apply: (rolls, options) => {
      // Multiply the final total (runs last due to high priority)
      return {
        rolls,
        transformTotal: total => total * options
      }
    }
  })

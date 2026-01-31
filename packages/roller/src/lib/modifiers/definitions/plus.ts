import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const plusPattern = /\+(\d+)/g

/**
 * Plus modifier - adds a fixed value to the total.
 *
 * Notation: +N (can appear multiple times, values are accumulated)
 * Examples:
 *   - 1d20+5 - Roll 1d20, add 5 to the total
 *   - 2d6+3+2 - Roll 2d6, add 5 to the total (3+2)
 */
export const plusModifier: TypedModifierDefinition<'plus'> = defineModifier<'plus'>({
  name: 'plus',
  priority: 90,

  pattern: /\+(\d+)/,

  parse: notation => {
    // Find all plus modifiers and accumulate them
    const matches = Array.from(notation.matchAll(plusPattern))
    if (matches.length === 0) return {}

    const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
    return { plus: total }
  },

  toNotation: options => {
    if (options < 0) {
      return `-${Math.abs(options)}`
    }
    return `+${options}`
  },

  toDescription: options => {
    return [`Add ${options}`]
  },

  apply: (rolls, options) => {
    // Plus adds to the total via transformTotal
    return {
      rolls,
      transformTotal: total => total + options
    }
  }
})

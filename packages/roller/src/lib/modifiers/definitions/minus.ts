import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const minusPattern = /-(\d+)/g

/**
 * Minus modifier - subtracts a fixed value from the total.
 *
 * Notation: -N (can appear multiple times, values are accumulated)
 * Examples:
 *   - 1d20-2 - Roll 1d20, subtract 2 from the total
 *   - 2d6-1-2 - Roll 2d6, subtract 3 from the total (1+2)
 */
export const minusModifier: TypedModifierDefinition<'minus'> = defineModifier<'minus'>({
  name: 'minus',
  priority: 91, // Just after plus

  pattern: /-(\d+)/,

  parse: notation => {
    // Find all minus modifiers and accumulate them
    const matches = Array.from(notation.matchAll(minusPattern))
    if (matches.length === 0) return {}

    const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
    return { minus: total }
  },

  toNotation: options => {
    return `-${options}`
  },

  toDescription: options => {
    return [`Subtract ${options}`]
  },

  apply: (rolls, options) => {
    // Minus subtracts from the total via transformTotal
    return {
      rolls,
      transformTotal: total => total - options
    }
  }
})

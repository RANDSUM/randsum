import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const multiplyPattern = /(?<!\*)\*(?!\*)(\d+)/

/**
 * Multiply modifier - multiplies the dice sum by a value (before arithmetic).
 *
 * Notation: *N (single asterisk)
 * Examples:
 *   - 2d6*2 - Roll 2d6, multiply dice sum by 2 before +/-
 *   - 2d6*2+3 - (2d6 * 2) + 3
 */
export const multiplyModifier: TypedModifierDefinition<'multiply'> = defineModifier<'multiply'>({
  name: 'multiply',
  priority: 85, // Before arithmetic (+/-)

  pattern: multiplyPattern,

  parse: notation => {
    const match = multiplyPattern.exec(notation)
    if (!match) return {}

    return { multiply: Number(match[1]) }
  },

  toNotation: options => {
    return `*${options}`
  },

  toDescription: options => {
    return [`Multiply dice by ${options}`]
  },

  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total * options
    }
  }
})

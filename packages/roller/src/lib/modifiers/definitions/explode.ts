import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const explodePattern = /(?<!!)!(?!!)/

/**
 * Explode modifier - when a die shows its maximum value, roll another die.
 *
 * Notation: ! (single exclamation mark)
 * Note: !! is compound, !p is penetrate
 *
 * Examples:
 *   - 3d6! - Exploding dice - if you roll a 6, add another d6 roll
 */
export const explodeModifier: TypedModifierDefinition<'explode'> = defineModifier<'explode'>({
  name: 'explode',
  priority: 50,
  requiresRollFn: true,
  requiresParameters: true,

  // Match ! but not !! or !p
  pattern: /(?<!!)!(?!!|p)/,

  parse: notation => {
    if (explodePattern.test(notation)) {
      return { explode: true }
    }
    return {}
  },

  toNotation: options => {
    return options ? '!' : undefined
  },

  toDescription: options => {
    if (!options) return []
    return ['Exploding Dice']
  },

  apply: (rolls, _options, ctx) => {
    // These are guaranteed by requires* flags
    const rollOne = ctx.rollOne as () => number
    const { sides } = ctx.parameters as { sides: number }

    const result = [...rolls]
    // Count original rolls to check against (avoid infinite loop from pushes)
    const originalCount = result.length
    for (let i = 0; i < originalCount; i++) {
      if (result[i] === sides) {
        const newRoll = rollOne()
        result.push(newRoll)
      }
    }

    return { rolls: result }
  }
})

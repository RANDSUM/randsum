import type { TypedModifierDefinition } from '../schema'
import { assertRequiredContext } from '../schema'
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
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const explosions = rolls.filter(roll => roll === parameters.sides).map(() => rollOne())

    return { rolls: [...rolls, ...explosions] }
  }
})

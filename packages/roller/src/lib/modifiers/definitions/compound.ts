import type { TypedModifierDefinition } from '../schema'
import { assertRequiredContext } from '../schema'
import { defineModifier } from '../registry'
import { ExplosionStrategies, applyAccumulatingExplosion, resolveExplosionDepth } from './explosion'

const compoundPattern = /!!(\d+)?/

/**
 * Compound modifier - like explode but adds to the original die instead of creating new dice.
 *
 * Notation: !! or !!N (N = max compound depth)
 * Examples:
 *   - 2d6!! - Compounding dice - if you roll 6, add another roll to that die
 *   - 2d6!!3 - Compound up to 3 times max
 *   - 2d6!!0 - Unlimited compounding
 */
export const compoundModifier: TypedModifierDefinition<'compound'> = defineModifier<'compound'>({
  name: 'compound',
  priority: 51,
  requiresRollFn: true,
  requiresParameters: true,

  pattern: compoundPattern,

  parse: notation => {
    const match = compoundPattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { compound: true }
    }
    return { compound: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!!'
    if (typeof options === 'number') return `!!${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Compounding Dice']
    if (options === 0) return ['Compounding Dice (unlimited)']
    if (typeof options === 'number') return [`Compounding Dice (max ${options} times)`]
    return []
  },

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides } = parameters
    const maxDepth = resolveExplosionDepth(options)

    const result = rolls.map(roll =>
      roll === sides
        ? applyAccumulatingExplosion(roll, sides, rollOne, maxDepth, ExplosionStrategies.compound)
        : roll
    )

    return { rolls: result }
  }
})

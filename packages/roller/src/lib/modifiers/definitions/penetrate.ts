import type { TypedModifierDefinition } from '../schema'
import { assertRequiredContext } from '../schema'
import { defineModifier } from '../registry'
import { ExplosionStrategies, applyAccumulatingExplosion, resolveExplosionDepth } from './explosion'

const penetratePattern = /!p(\d+)?/i

/**
 * Penetrate modifier - like compound but each subsequent roll subtracts 1.
 *
 * Notation: !p or !pN (N = max penetration depth)
 * Examples:
 *   - 2d6!p - Penetrating dice - if you roll 6, add (next roll - 1)
 *   - 2d6!p3 - Penetrate up to 3 times max
 *   - 2d6!p0 - Unlimited penetration
 */
export const penetrateModifier: TypedModifierDefinition<'penetrate'> = defineModifier<'penetrate'>({
  name: 'penetrate',
  priority: 52,
  requiresRollFn: true,
  requiresParameters: true,

  pattern: penetratePattern,

  parse: notation => {
    const match = penetratePattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { penetrate: true }
    }
    return { penetrate: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!p'
    if (typeof options === 'number') return `!p${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Penetrating Dice']
    if (options === 0) return ['Penetrating Dice (unlimited)']
    if (typeof options === 'number') return [`Penetrating Dice (max ${options} times)`]
    return []
  },

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides } = parameters
    const maxDepth = resolveExplosionDepth(options)

    const result = rolls.map(roll =>
      roll === sides
        ? applyAccumulatingExplosion(roll, sides, rollOne, maxDepth, ExplosionStrategies.penetrate)
        : roll
    )

    return { rolls: result }
  }
})

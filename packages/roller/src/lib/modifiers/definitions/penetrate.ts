import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

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

    // No depth specified means true (default), 0 means unlimited
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
    // These are guaranteed by requires* flags
    const rollOne = ctx.rollOne as () => number
    const { sides } = ctx.parameters as { sides: number }

    // Determine max depth: true = infinite, 0 = infinite, number = limit
    const maxDepth = options === true ? 1000 : options === 0 ? 1000 : (options as number)

    const result = rolls.map(roll => {
      if (roll !== sides) return roll

      let total = roll
      let depth = 0

      while (depth < maxDepth) {
        const newRoll = rollOne()
        // Penetration: add (newRoll - 1), minimum of 1
        total += Math.max(1, newRoll - 1)
        depth++

        if (newRoll !== sides) break
      }

      return total
    })

    return { rolls: result }
  }
})

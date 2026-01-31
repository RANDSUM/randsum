import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

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

    // No depth specified means true (default), 0 means unlimited
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
        total += newRoll
        depth++

        if (newRoll !== sides) break
      }

      return total
    })

    return { rolls: result }
  }
})

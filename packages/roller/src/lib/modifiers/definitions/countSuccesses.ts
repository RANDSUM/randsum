import type { TypedModifierDefinition } from '../schema'
import { defineModifier } from '../registry'

const countSuccessesPattern = /[Ss]\{(\d+)(?:,(\d+))?\}/

/**
 * Count Successes modifier - counts how many dice meet a success threshold.
 *
 * Notation: S{threshold} or S{threshold,botchThreshold}
 * Examples:
 *   - 5d10S{7} - Roll 5d10, count how many are >= 7
 *   - 5d10S{7,1} - Count successes >= 7, botches <= 1
 */
export const countSuccessesModifier: TypedModifierDefinition<'countSuccesses'> =
  defineModifier<'countSuccesses'>({
    name: 'countSuccesses',
    priority: 95, // After multiply, before multiplyTotal

    pattern: countSuccessesPattern,

    parse: notation => {
      const match = countSuccessesPattern.exec(notation)
      if (!match) return {}

      const threshold = Number(match[1])
      const botchThreshold = match[2] ? Number(match[2]) : undefined

      if (botchThreshold !== undefined) {
        return {
          countSuccesses: {
            threshold,
            botchThreshold
          }
        }
      }

      return {
        countSuccesses: {
          threshold
        }
      }
    },

    toNotation: options => {
      if (options.botchThreshold !== undefined) {
        return `S{${options.threshold},${options.botchThreshold}}`
      }
      return `S{${options.threshold}}`
    },

    toDescription: options => {
      if (options.botchThreshold !== undefined) {
        return [`Count successes >= [${options.threshold}], botches <= [${options.botchThreshold}]`]
      }
      return [`Count successes >= [${options.threshold}]`]
    },

    apply: (rolls, options) => {
      // Count successes replaces the normal sum with a count
      return {
        rolls,
        transformTotal: (_total, currentRolls) => {
          const successCount = currentRolls.filter(roll => roll >= options.threshold).length
          const { botchThreshold } = options
          const botchCount =
            botchThreshold !== undefined
              ? currentRolls.filter(roll => roll <= botchThreshold).length
              : 0
          return successCount - botchCount
        }
      }
    }
  })

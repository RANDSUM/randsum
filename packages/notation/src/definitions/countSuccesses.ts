import type { CountOptions } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'
const countSuccessesPattern = /(?<!!)[Ss]\{(\d+)(?:,(\d+))?\}/

export const countSuccessesSchema: NotationSchema<CountOptions> =
  defineNotationSchema<CountOptions>({
    name: 'count',
    priority: 95,

    pattern: countSuccessesPattern,

    parse: notation => {
      const match = countSuccessesPattern.exec(notation)
      if (!match) return {}

      const threshold = Number(match[1])
      const botchThreshold = match[2] ? Number(match[2]) : undefined

      if (botchThreshold !== undefined) {
        return {
          count: { greaterThanOrEqual: threshold, lessThanOrEqual: botchThreshold, deduct: true }
        }
      }

      return { count: { greaterThanOrEqual: threshold } }
    },

    toNotation: options => {
      if (options.greaterThanOrEqual === undefined) return undefined
      if (options.deduct && options.lessThanOrEqual !== undefined) {
        return `S{${options.greaterThanOrEqual},${options.lessThanOrEqual}}`
      }
      return `S{${options.greaterThanOrEqual}}`
    },

    toDescription: options => {
      if (options.greaterThanOrEqual === undefined) return []
      if (options.deduct && options.lessThanOrEqual !== undefined) {
        return [
          `Count successes >= ${options.greaterThanOrEqual}, botches <= ${options.lessThanOrEqual}`
        ]
      }
      return [`Count successes >= ${options.greaterThanOrEqual}`]
    }
  })

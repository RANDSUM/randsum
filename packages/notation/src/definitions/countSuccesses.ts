import type { SuccessCountOptions } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'
const countSuccessesPattern = /[Ss]\{(\d+)(?:,(\d+))?\}/

export const countSuccessesSchema: NotationSchema<SuccessCountOptions> =
  defineNotationSchema<SuccessCountOptions>({
    name: 'countSuccesses',
    priority: 95,

    pattern: countSuccessesPattern,

    parse: notation => {
      const match = countSuccessesPattern.exec(notation)
      if (!match) return {}

      const threshold = Number(match[1])
      const botchThreshold = match[2] ? Number(match[2]) : undefined

      if (botchThreshold !== undefined) {
        return { countSuccesses: { threshold, botchThreshold } }
      }

      return { countSuccesses: { threshold } }
    },

    toNotation: options => {
      if (options.botchThreshold !== undefined) {
        return `S{${options.threshold},${options.botchThreshold}}`
      }
      return `S{${options.threshold}}`
    },

    toDescription: options => {
      if (options.botchThreshold !== undefined) {
        return [`Count successes >= ${options.threshold}, botches <= ${options.botchThreshold}`]
      }
      return [`Count successes >= ${options.threshold}`]
    }
  })

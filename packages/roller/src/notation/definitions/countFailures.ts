import type { CountOptions } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'

const countFailuresPattern = /[Ff]\{(\d+)\}/

export const countFailuresSchema: NotationSchema<CountOptions> = defineNotationSchema<CountOptions>(
  {
    name: 'count',
    priority: 96,

    pattern: countFailuresPattern,

    parse: notation => {
      const match = countFailuresPattern.exec(notation)
      if (!match) return {}

      const threshold = Number(match[1])

      return { count: { lessThanOrEqual: threshold } }
    },

    toNotation: options => {
      if (options.lessThanOrEqual === undefined) return undefined
      return `F{${options.lessThanOrEqual}}`
    },

    toDescription: options => {
      if (options.lessThanOrEqual === undefined) return []
      return [`Count failures at or below ${options.lessThanOrEqual}`]
    }
  }
)

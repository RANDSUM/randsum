import type { FailureCountOptions } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'

const countFailuresPattern = /[Ff]\{(\d+)\}/

export const countFailuresSchema: NotationSchema<FailureCountOptions> =
  defineNotationSchema<FailureCountOptions>({
    name: 'countFailures',
    priority: 96,

    pattern: countFailuresPattern,

    parse: notation => {
      const match = countFailuresPattern.exec(notation)
      if (!match) return {}

      const threshold = Number(match[1])

      return { countFailures: { threshold } }
    },

    toNotation: options => {
      return `F{${options.threshold}}`
    },

    toDescription: options => {
      return [`Count failures at or below ${options.threshold}`]
    }
  })

import type { ModifierOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const plusPattern = /\+(\d+)/
const plusGlobalPattern = /\+(\d+)/g

export const plusSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'plus',
  priority: 90,

  pattern: plusPattern,

  parse: notation => {
    const matches = Array.from(notation.matchAll(plusGlobalPattern))
    if (matches.length === 0) return {}

    const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
    const result: Pick<ModifierOptions, 'plus'> = { plus: total }
    return result
  },

  toNotation: options => {
    if (options < 0) {
      return `-${Math.abs(options)}`
    }
    return `+${options}`
  },

  toDescription: options => {
    return [`Add ${options}`]
  }
})

export const plusModifier: ModifierDefinition<number> = {
  ...plusSchema,
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total + options
    }
  }
}

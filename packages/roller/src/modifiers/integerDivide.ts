import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const integerDividePattern = /\/\/(\d+)/

export const integerDivideSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'integerDivide',
  priority: 93,

  pattern: integerDividePattern,

  parse: notation => {
    const match = integerDividePattern.exec(notation)
    if (!match) return {}

    return { integerDivide: Number(match[1]) }
  },

  toNotation: options => {
    return `//${options}`
  },

  toDescription: options => {
    return [`Integer divide by ${options}`]
  }
})

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => Math.trunc(total / options)
    }
  }
}

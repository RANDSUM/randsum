import type { ModifierOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

const minusPattern = /-(\d+)/
const minusGlobalPattern = /-(\d+)/g

export const minusSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'minus',
  priority: 91,

  pattern: minusPattern,

  parse: notation => {
    const matches = Array.from(notation.matchAll(minusGlobalPattern))
    if (matches.length === 0) return {}

    const total = matches.reduce((sum, match) => sum + Number(match[1]), 0)
    const result: Pick<ModifierOptions, 'minus'> = { minus: total }
    return result
  },

  toNotation: options => {
    return `-${options}`
  },

  toDescription: options => {
    return [`Subtract ${options}`]
  }
})

export const minusModifier: ModifierDefinition<number> = {
  ...minusSchema,
  ...createScaleBehavior((total, value) => total - value)
}

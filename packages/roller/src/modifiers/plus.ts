import type { ModifierOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

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
  },

  docs: [
    {
      key: '+',
      category: 'Scale',
      color: '#4ade80',
      colorLight: '#16a34a',
      title: 'Add',
      description: 'Add a fixed number to the total after all dice are rolled.',
      displayBase: '+',
      displayOptional: 'n',
      forms: [{ notation: '+n', note: 'Add n to total' }],
      examples: [
        { notation: '1d20+5', description: 'Roll 1d20, add 5' },
        { notation: '2d6+3', description: 'Roll 2d6, add 3' }
      ]
    }
  ]
})

export const plusModifier: ModifierDefinition<number> = {
  ...plusSchema,
  ...createScaleBehavior((total, value) => total + value)
}

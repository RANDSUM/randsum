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
  },

  docs: [
    {
      key: '-',
      category: 'Scale',
      color: '#f87171',
      colorLight: '#dc2626',
      title: 'Subtract',
      description: 'Subtract a fixed number from the total after all dice are rolled.',
      displayBase: '\u2212',
      displayOptional: 'n',
      forms: [{ notation: '-n', note: 'Subtract n from total' }],
      examples: [
        { notation: '1d20-2', description: 'Roll 1d20, subtract 2' },
        { notation: '4d6L-1', description: 'Drop lowest, subtract 1' }
      ],
      optionsExamples: [
        { description: 'Subtract 2 from total', options: { sides: 20, modifiers: { minus: 2 } } },
        {
          description: 'Subtract 1 from total',
          options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 }, minus: 1 } }
        }
      ]
    }
  ]
})

export const minusModifier: ModifierDefinition<number> = {
  ...minusSchema,
  ...createScaleBehavior((total, value) => total - value)
}

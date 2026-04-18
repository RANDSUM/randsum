import type { ModifierOptions } from '../notation/types'
import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'
import { sumMatchCounts } from './shared/extractCount'
import { createScaleBehavior } from './shared/scale'

const plusPattern = /\+(\d+)/
const plusGlobalPattern = /\+(\d+)/g

export const plusSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'plus',
  priority: 90,

  pattern: plusPattern,

  docs: [
    {
      key: '+',
      category: 'Scale',
      color: '#4ade80',
      colorLight: '#16a34a',
      title: 'Add',
      description: 'Add a fixed number to the total after all dice are rolled.',
      displayBase: '+',
      forms: [{ notation: '+n', note: 'Add n to total' }],
      examples: [
        {
          description: 'Roll 1d20, add 5',
          notation: '1d20+5',
          options: { sides: 20, modifiers: { plus: 5 } }
        },
        {
          description: 'Roll 2d6, add 3',
          notation: '2d6+3',
          options: { sides: 6, quantity: 2, modifiers: { plus: 3 } }
        }
      ]
    }
  ] satisfies readonly NotationDoc[],

  parse: notation => {
    const total = sumMatchCounts(notation, plusGlobalPattern)
    if (total === undefined) return {}

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
  ...createScaleBehavior((total, value) => total + value)
}

import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

type SortDirection = 'asc' | 'desc'

// Matches sa, sd (case-insensitive) but NOT S{ (count successes); bare s is not valid per spec
const sortPattern = /[Ss]([Aa]|[Dd])(?![{\d])/

export const sortSchema: NotationSchema<SortDirection> = defineNotationSchema<SortDirection>({
  name: 'sort',
  priority: 95,

  pattern: sortPattern,

  parse: notation => {
    const match = sortPattern.exec(notation)
    if (!match) return {}

    const direction = match[1]
    if (direction === 'd' || direction === 'D') {
      return { sort: 'desc' }
    }
    return { sort: 'asc' }
  },

  toNotation: options => {
    return options === 'desc' ? 'sd' : 'sa'
  },

  toDescription: options => {
    return [options === 'desc' ? 'Sort descending' : 'Sort ascending']
  },

  docs: [
    {
      key: 'sort',
      category: 'Order',
      color: '#94a3b8',
      colorLight: '#475569',
      title: 'Sort',
      description:
        'Sort the dice pool in ascending or descending order. Does not affect the total \u2014 only the presentation order of dice.',
      displayBase: 'sa',
      displayOptional: '/sd',
      forms: [
        { notation: 'sa', note: 'Sort ascending' },
        { notation: 'sd', note: 'Sort descending' }
      ],
      examples: [
        { notation: '4d6sa', description: 'Roll 4d6, display sorted low to high' },
        { notation: '4d6sd', description: 'Roll 4d6, display sorted high to low' }
      ],
      optionsExamples: [
        {
          description: 'Sort ascending',
          options: { sides: 6, quantity: 4, modifiers: { sort: 'asc' } }
        },
        {
          description: 'Sort descending',
          options: { sides: 6, quantity: 4, modifiers: { sort: 'desc' } }
        }
      ]
    }
  ]
})

export const sortModifier: ModifierDefinition<SortDirection> = {
  ...sortSchema,

  apply: (rolls, options) => {
    const sorted = [...rolls].sort((a, b) => (options === 'desc' ? b - a : a - b))
    return { rolls: sorted }
  }
}

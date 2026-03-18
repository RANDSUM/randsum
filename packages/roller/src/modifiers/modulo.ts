import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const moduloPattern = /%(\d+)/

export const moduloSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'modulo',
  priority: 94,

  pattern: moduloPattern,

  parse: notation => {
    const match = moduloPattern.exec(notation)
    if (!match) return {}

    return { modulo: Number(match[1]) }
  },

  toNotation: options => {
    return `%${options}`
  },

  toDescription: options => {
    return [`Modulo ${options}`]
  },

  docs: [
    {
      key: '%',
      category: 'Arithmetic',
      color: '#10b981',
      colorLight: '#047857',
      title: 'Modulo',
      description: 'Take the remainder after dividing the total by a number.',
      displayBase: '%',
      displayOptional: 'n',
      forms: [{ notation: '%n', note: 'Total modulo n' }],
      examples: [
        { notation: '1d20%5', description: 'Roll 1d20, result mod 5' },
        { notation: '2d6%3', description: 'Roll 2d6, remainder after dividing by 3' }
      ]
    }
  ]
})

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total % options
    }
  }
}

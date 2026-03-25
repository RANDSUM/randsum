import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

const moduloPattern = /%(\d+)/

export const moduloSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'modulo',
  priority: 94,

  pattern: moduloPattern,

  docs: [
    {
      key: '%',
      category: 'Scale',
      color: '#10b981',
      colorLight: '#047857',
      title: 'Modulo',
      description: 'Take the remainder after dividing the total by a number.',
      displayBase: '%',
      forms: [{ notation: '%n', note: 'Total modulo n' }],
      examples: [
        {
          description: 'Roll 1d20, result mod 5',
          notation: '1d20%5',
          options: { sides: 20, modifiers: { modulo: 5 } }
        },
        {
          description: 'Roll 2d6, remainder after dividing by 3',
          notation: '2d6%3',
          options: { sides: 6, quantity: 2, modifiers: { modulo: 3 } }
        }
      ]
    }
  ] satisfies readonly NotationDoc[],

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
  }
})

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...createScaleBehavior((total, value) => total % value)
}

import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const multiplyTotalPattern = /\*\*(\d+)/

export const multiplyTotalSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'multiplyTotal',
  priority: 100,

  pattern: multiplyTotalPattern,

  parse: notation => {
    const match = multiplyTotalPattern.exec(notation)
    if (!match) return {}

    return { multiplyTotal: Number(match[1]) }
  },

  toNotation: options => {
    return `**${options}`
  },

  toDescription: options => {
    return [`Multiply total by ${options}`]
  },

  docs: [
    {
      key: '**',
      category: 'Arithmetic',
      color: '#84cc16',
      colorLight: '#3f6212',
      title: 'Multiply Total',
      description: 'Multiply the entire final total after all other modifiers have been applied.',
      displayBase: '**',
      displayOptional: 'n',
      forms: [{ notation: '**n', note: 'Multiply final total by n' }],
      examples: [
        { notation: '2d6+3**2', description: '(roll + 3) \u00d7 2' },
        { notation: '4d6L**3', description: '(drop-lowest sum) \u00d7 3' }
      ]
    }
  ]
})

export const multiplyTotalModifier: ModifierDefinition<number> = {
  ...multiplyTotalSchema,
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total * options
    }
  }
}

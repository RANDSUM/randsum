import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const multiplyPattern = /(?<!\*)\*(?!\*)(\d+)/

export const multiplySchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'multiply',
  priority: 85,

  pattern: multiplyPattern,

  parse: notation => {
    const match = multiplyPattern.exec(notation)
    if (!match) return {}

    return { multiply: Number(match[1]) }
  },

  toNotation: options => {
    return `*${options}`
  },

  toDescription: options => {
    return [`Multiply dice by ${options}`]
  },

  docs: [
    {
      key: '*',
      category: 'Arithmetic',
      color: '#a3e635',
      colorLight: '#4d7c0f',
      title: 'Multiply Dice',
      description: 'Multiply the dice sum before applying +/\u2212 arithmetic modifiers.',
      displayBase: '*',
      displayOptional: 'n',
      forms: [{ notation: '*n', note: 'Multiply dice sum by n (pre-arithmetic)' }],
      examples: [
        { notation: '2d6*2+3', description: '(roll \u00d7 2) + 3' },
        { notation: '4d6*3', description: 'Triple the dice sum' }
      ]
    }
  ]
})

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total * options
    }
  }
}

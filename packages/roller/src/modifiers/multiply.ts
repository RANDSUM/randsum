import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

const multiplyPattern = /(?<!\*)\*(?!\*)(\d+)/

export const multiplySchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'multiply',
  priority: 85,

  pattern: multiplyPattern,

  docs: [
    {
      key: '*',
      category: 'Scale',
      color: '#a3e635',
      colorLight: '#4d7c0f',
      title: 'Multiply Dice',
      description: 'Multiply the dice sum before applying +/\u2212 arithmetic modifiers.',
      displayBase: '*',
      forms: [{ notation: '*n', note: 'Multiply dice sum by n (pre-arithmetic)' }],
      examples: [
        { description: '(roll \u00d7 2) + 3', notation: '2d6*2+3' },
        {
          description: 'Triple the dice sum',
          notation: '4d6*3',
          options: { sides: 6, quantity: 4, modifiers: { multiply: 3 } }
        }
      ]
    }
  ] satisfies readonly NotationDoc[],

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
  }
})

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...createScaleBehavior((total, value) => total * value)
}

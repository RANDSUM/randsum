import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

const integerDividePattern = /\/\/(\d+)/

export const integerDivideSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'integerDivide',
  priority: 93,

  pattern: integerDividePattern,

  docs: [
    {
      key: '//',
      category: 'Scale',
      color: '#34d399',
      colorLight: '#059669',
      title: 'Integer Divide',
      description: 'Divide the total by a number and round down (floor division).',
      displayBase: '//',
      forms: [{ notation: '//n', note: 'Divide total by n, round down' }],
      examples: [
        {
          description: 'Roll 2d6, halve (round down)',
          notation: '2d6//2',
          options: { sides: 6, quantity: 2, modifiers: { integerDivide: 2 } }
        },
        {
          description: 'Drop lowest, then divide by 3',
          notation: '4d6L//3',
          options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 }, integerDivide: 3 } }
        }
      ]
    }
  ] satisfies readonly NotationDoc[],

  parse: notation => {
    const match = integerDividePattern.exec(notation)
    if (!match) return {}

    return { integerDivide: Number(match[1]) }
  },

  toNotation: options => {
    return `//${options}`
  },

  toDescription: options => {
    return [`Integer divide by ${options}`]
  }
})

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  ...createScaleBehavior((total, value) => Math.trunc(total / value))
}

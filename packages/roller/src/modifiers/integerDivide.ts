import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

const integerDividePattern = /\/\/(\d+)/

export const integerDivideSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'integerDivide',
  priority: 93,

  pattern: integerDividePattern,

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
  },

  docs: [
    {
      key: '//',
      category: 'Scale',
      color: '#34d399',
      colorLight: '#059669',
      title: 'Integer Divide',
      description: 'Divide the total by a number and round down (floor division).',
      displayBase: '//',
      displayOptional: 'n',
      forms: [{ notation: '//n', note: 'Divide total by n, round down' }],
      examples: [
        { notation: '2d6//2', description: 'Roll 2d6, halve (round down)' },
        { notation: '4d6L//3', description: 'Drop lowest, then divide by 3' }
      ]
    }
  ]
})

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  ...createScaleBehavior((total, value) => Math.trunc(total / value))
}

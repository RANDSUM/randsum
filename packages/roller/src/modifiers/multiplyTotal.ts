import { defineNotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const multiplyTotalPattern = /\*\*(\d+)/

export const multiplyTotalSchema = defineNotationSchema<number>({
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
  }
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

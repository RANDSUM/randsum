import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

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
  }
})

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...createScaleBehavior((total, value) => total * value)
}

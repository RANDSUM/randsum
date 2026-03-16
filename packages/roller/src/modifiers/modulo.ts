import { defineNotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

const moduloPattern = /%(\d+)/

export const moduloSchema = defineNotationSchema<number>({
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
  }
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

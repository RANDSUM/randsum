import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

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
  }
})

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...createScaleBehavior((total, value) => total % value)
}

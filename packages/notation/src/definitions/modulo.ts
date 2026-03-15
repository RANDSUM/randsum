import { type NotationSchema, defineNotationSchema } from '../schema'

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

import { type NotationSchema, defineNotationSchema } from '../schema'

// The divisor is a positive integer (RDN ABNF), so `%0` is not notation.
const moduloPattern = /%([1-9]\d*)/

export const moduloSchema: NotationSchema<number> = defineNotationSchema<number>({
  name: 'modulo',
  priority: 94,
  lexemeKey: '%',
  category: 'Scale',

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

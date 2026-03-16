import { type NotationSchema, defineNotationSchema } from '../schema'

const explodeSequencePattern = /![sS]\{[\d,]+\}/

export const explodeSequenceSchema: NotationSchema<number[]> = defineNotationSchema<number[]>({
  name: 'explodeSequence',
  priority: 53,

  pattern: /![sS]\{[\d,]+\}|![iI]|![rR]/,

  parse: notation => {
    const match = explodeSequencePattern.exec(notation)
    if (!match) return {}

    const inner = match[0].slice(3, -1) // strip "!s{" and "}"
    const sequence = inner.split(',').map(Number)
    return { explodeSequence: sequence }
  },

  toNotation: options => {
    if (!Array.isArray(options) || options.length === 0) return undefined
    return `!s{${options.join(',')}}`
  },

  toDescription: options => {
    if (!Array.isArray(options) || options.length === 0) return []
    const parts = options.map(s => `d${s}`)
    return [`Explode through sequence: ${parts.join(', ')}`]
  }
})

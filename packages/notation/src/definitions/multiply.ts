import { type NotationSchema, defineNotationSchema } from '../schema'
import { registerNotationSchema } from '../registry'

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

registerNotationSchema(multiplySchema)

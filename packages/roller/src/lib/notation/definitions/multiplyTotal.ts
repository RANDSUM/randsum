import { type NotationSchema, defineNotationSchema } from '../schema'

const multiplyTotalPattern = /\*\*(\d+)/

export const multiplyTotalSchema: NotationSchema<number> = defineNotationSchema<number>({
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

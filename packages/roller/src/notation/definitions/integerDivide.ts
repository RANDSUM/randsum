import { type NotationSchema, defineNotationSchema } from '../schema'

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
  }
})

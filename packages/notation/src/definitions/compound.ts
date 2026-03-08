import { type NotationSchema, defineNotationSchema } from '../schema'
import { registerNotationSchema } from '../registry'

const compoundPattern = /!!(\d+)?/

export const compoundSchema: NotationSchema<boolean | number> = defineNotationSchema<
  boolean | number
>({
  name: 'compound',
  priority: 51,

  pattern: compoundPattern,

  parse: notation => {
    const match = compoundPattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { compound: true }
    }
    return { compound: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!!'
    if (typeof options === 'number') return `!!${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Compounding Dice']
    if (options === 0) return ['Compounding Dice (unlimited)']
    if (typeof options === 'number') return [`Compounding Dice (max ${options} times)`]
    return []
  }
})

registerNotationSchema(compoundSchema)

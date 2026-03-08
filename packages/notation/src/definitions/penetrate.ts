import { type NotationSchema, defineNotationSchema } from '../schema'
import { registerNotationSchema } from '../registry'

const penetratePattern = /!p(\d+)?/i

export const penetrateSchema: NotationSchema<boolean | number> = defineNotationSchema<
  boolean | number
>({
  name: 'penetrate',
  priority: 52,

  pattern: penetratePattern,

  parse: notation => {
    const match = penetratePattern.exec(notation)
    if (!match) return {}

    const depth = match[1]
    if (depth === undefined) {
      return { penetrate: true }
    }
    return { penetrate: Number(depth) }
  },

  toNotation: options => {
    if (options === true) return '!p'
    if (typeof options === 'number') return `!p${options}`
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['Penetrating Dice']
    if (options === 0) return ['Penetrating Dice (unlimited)']
    if (typeof options === 'number') return [`Penetrating Dice (max ${options} times)`]
    return []
  }
})

registerNotationSchema(penetrateSchema)

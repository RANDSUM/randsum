import { type NotationSchema, defineNotationSchema } from '../schema'

const explodePattern = /(?<!!)!(?!!)/

export const explodeSchema: NotationSchema<boolean | number> = defineNotationSchema<
  boolean | number
>({
  name: 'explode',
  priority: 50,

  pattern: /(?<!!)!(?!!|p)/,

  parse: notation => {
    if (explodePattern.test(notation)) {
      return { explode: true }
    }
    return {}
  },

  toNotation: options => {
    return options ? '!' : undefined
  },

  toDescription: options => {
    if (!options) return []
    return ['Exploding Dice']
  }
})

import { type NotationSchema, defineNotationSchema } from '../schema'

const wildDiePattern = /[Ww](?![{])/

export const wildDieSchema: NotationSchema<boolean> = defineNotationSchema<boolean>({
  name: 'wildDie',
  priority: 55,

  pattern: wildDiePattern,

  parse: notation => {
    const match = wildDiePattern.exec(notation)
    if (!match) return {}
    return { wildDie: true }
  },

  toNotation: options => {
    if (options) return 'W'
    return undefined
  },

  toDescription: options => {
    if (options) return ['Wild Die (compound on max, penalty on 1)']
    return []
  }
})

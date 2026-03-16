import type { UniqueOptions } from '../types'
import { formatHumanList } from '../formatHumanList'
import { type NotationSchema, defineNotationSchema } from '../schema'
const uniquePattern = /[Uu](?:\{([^}]{1,50})\})?/

export const uniqueSchema: NotationSchema<boolean | UniqueOptions> = defineNotationSchema<
  boolean | UniqueOptions
>({
  name: 'unique',
  priority: 60,

  pattern: uniquePattern,

  parse: notation => {
    const match = uniquePattern.exec(notation)
    if (!match) return {}

    if (!match[1]) {
      return { unique: true }
    }

    const exceptions = match[1]
      .split(',')
      .map(s => Number(s.trim()))
      .filter(n => !isNaN(n))

    return { unique: { notUnique: exceptions } }
  },

  toNotation: options => {
    if (options === true) return 'U'
    if (typeof options === 'object') {
      return `U{${options.notUnique.join(',')}}`
    }
    return undefined
  },

  toDescription: options => {
    if (options === true) return ['No Duplicate Rolls']
    if (typeof options === 'object') {
      return [`No Duplicates (except ${formatHumanList(options.notUnique)})`]
    }
    return []
  }
})

import { type NotationSchema, defineNotationSchema } from '../schema'

type SortDirection = 'asc' | 'desc'

// Matches s, sa, sd (case-insensitive) but NOT S{ (count successes)
const sortPattern = /[Ss]([Aa]|[Dd])?(?![{\d])/

export const sortSchema: NotationSchema<SortDirection> = defineNotationSchema<SortDirection>({
  name: 'sort',
  priority: 92,

  pattern: sortPattern,

  parse: notation => {
    const match = sortPattern.exec(notation)
    if (!match) return {}

    const direction = match[1]
    if (direction === 'd' || direction === 'D') {
      return { sort: 'desc' }
    }
    return { sort: 'asc' }
  },

  toNotation: options => {
    return options === 'desc' ? 'sd' : 's'
  },

  toDescription: options => {
    return [options === 'desc' ? 'Sort descending' : 'Sort ascending']
  }
})

import { defineNotationSchema } from '../notation/schema'
import type { NotationSchema } from '../notation/schema'
import type { ModifierDefinition } from './schema'

type SortDirection = 'asc' | 'desc'

// Matches sa, sd (case-insensitive) but NOT S{ (count successes); bare s is not valid per spec
const sortPattern = /[Ss]([Aa]|[Dd])(?![{\d])/

export const sortSchema: NotationSchema<SortDirection> = defineNotationSchema<SortDirection>({
  name: 'sort',
  priority: 95,

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
    return options === 'desc' ? 'sd' : 'sa'
  },

  toDescription: options => {
    return [options === 'desc' ? 'Sort descending' : 'Sort ascending']
  }
})

export const sortModifier: ModifierDefinition<SortDirection> = {
  ...sortSchema,

  apply: (rolls, options) => {
    const sorted = [...rolls].sort((a, b) => (options === 'desc' ? b - a : a - b))
    return { rolls: sorted }
  }
}

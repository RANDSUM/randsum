import type { ModifierBehavior } from '../schema'

type SortDirection = 'asc' | 'desc'

export const sortBehavior: ModifierBehavior<SortDirection> = {
  apply: (rolls, options) => {
    const sorted = [...rolls].sort((a, b) => (options === 'desc' ? b - a : a - b))
    return { rolls: sorted }
  }
}

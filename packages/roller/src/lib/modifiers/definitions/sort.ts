import type { ModifierDefinition } from '../schema'
import { sortSchema } from '@randsum/notation'
import { sortBehavior } from '../behaviors/sort'

type SortDirection = 'asc' | 'desc'

export const sortModifier: ModifierDefinition<SortDirection> = {
  ...sortSchema,
  ...sortBehavior
}

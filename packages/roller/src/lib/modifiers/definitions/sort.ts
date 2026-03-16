import type { ModifierDefinition } from '../schema'
import { sortSchema } from '../../../notation/definitions/sort'
import { sortBehavior } from '../behaviors/sort'

type SortDirection = 'asc' | 'desc'

export const sortModifier: ModifierDefinition<SortDirection> = {
  ...sortSchema,
  ...sortBehavior
}

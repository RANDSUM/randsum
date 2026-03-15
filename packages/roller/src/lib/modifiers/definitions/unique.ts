import type { UniqueOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { uniqueSchema } from '@randsum/notation'
import { uniqueBehavior } from '../behaviors/unique'

export const uniqueModifier: ModifierDefinition<boolean | UniqueOptions> = {
  ...uniqueSchema,
  ...uniqueBehavior
}

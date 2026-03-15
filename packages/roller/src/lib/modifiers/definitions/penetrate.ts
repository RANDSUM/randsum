import type { ModifierDefinition } from '../schema'
import { penetrateSchema } from '@randsum/notation/schemas'
import { penetrateBehavior } from '../behaviors/penetrate'

export const penetrateModifier: ModifierDefinition<boolean | number> = {
  ...penetrateSchema,
  ...penetrateBehavior
}

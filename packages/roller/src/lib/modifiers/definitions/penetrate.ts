import type { ModifierDefinition } from '../schema'
import { penetrateSchema } from '@randsum/notation/schemas'
import { penetrateBehavior } from '../behaviors/penetrate'
import { defineModifier } from '../registry'

export const penetrateModifier: ModifierDefinition<boolean | number> = defineModifier(
  penetrateSchema,
  penetrateBehavior
)

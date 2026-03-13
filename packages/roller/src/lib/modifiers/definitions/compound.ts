import type { ModifierDefinition } from '../schema'
import { compoundSchema } from '@randsum/notation/schemas'
import { compoundBehavior } from '../behaviors/compound'
import { defineModifier } from '../registry'

export const compoundModifier: ModifierDefinition<boolean | number> = defineModifier(
  compoundSchema,
  compoundBehavior
)

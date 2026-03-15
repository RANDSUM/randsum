import type { ModifierDefinition } from '../schema'
import { compoundSchema } from '@randsum/notation/schemas'
import { compoundBehavior } from '../behaviors/compound'

export const compoundModifier: ModifierDefinition<boolean | number> = {
  ...compoundSchema,
  ...compoundBehavior
}

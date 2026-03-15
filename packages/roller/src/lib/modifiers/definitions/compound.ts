import type { ModifierDefinition } from '../schema'
import { compoundSchema } from '@randsum/notation'
import { compoundBehavior } from '../behaviors/compound'

export const compoundModifier: ModifierDefinition<boolean | number> = {
  ...compoundSchema,
  ...compoundBehavior
}

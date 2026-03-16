import type { ModifierDefinition } from '../schema'
import { compoundSchema } from '../../../notation/definitions/compound'
import { compoundBehavior } from '../behaviors/compound'

export const compoundModifier: ModifierDefinition<boolean | number> = {
  ...compoundSchema,
  ...compoundBehavior
}

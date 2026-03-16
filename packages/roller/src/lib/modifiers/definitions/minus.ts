import type { ModifierDefinition } from '../schema'
import { minusSchema } from '../../../notation/definitions/minus'
import { minusBehavior } from '../behaviors/arithmetic'

export const minusModifier: ModifierDefinition<number> = {
  ...minusSchema,
  ...minusBehavior
}

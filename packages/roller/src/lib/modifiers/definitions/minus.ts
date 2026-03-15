import type { ModifierDefinition } from '../schema'
import { minusSchema } from '@randsum/notation'
import { minusBehavior } from '../behaviors/arithmetic'

export const minusModifier: ModifierDefinition<number> = {
  ...minusSchema,
  ...minusBehavior
}

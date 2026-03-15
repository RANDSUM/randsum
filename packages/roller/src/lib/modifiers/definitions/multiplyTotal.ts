import type { ModifierDefinition } from '../schema'
import { multiplyTotalSchema } from '@randsum/notation/schemas'
import { multiplyTotalBehavior } from '../behaviors/multiplyTotal'

export const multiplyTotalModifier: ModifierDefinition<number> = {
  ...multiplyTotalSchema,
  ...multiplyTotalBehavior
}

import type { ModifierDefinition } from '../schema'
import { multiplyTotalSchema } from '../../../notation/definitions/multiplyTotal'
import { multiplyBehavior } from '../behaviors/multiply'

export const multiplyTotalModifier: ModifierDefinition<number> = {
  ...multiplyTotalSchema,
  ...multiplyBehavior
}

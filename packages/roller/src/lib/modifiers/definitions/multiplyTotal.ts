import type { ModifierDefinition } from '../schema'
import { multiplyTotalSchema } from '@randsum/notation'
import { multiplyBehavior } from '../behaviors/multiply'

export const multiplyTotalModifier: ModifierDefinition<number> = {
  ...multiplyTotalSchema,
  ...multiplyBehavior
}

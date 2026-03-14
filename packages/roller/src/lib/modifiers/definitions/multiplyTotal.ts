import type { ModifierDefinition } from '../schema'
import { multiplyTotalSchema } from '@randsum/notation/schemas'
import { multiplyTotalBehavior } from '../behaviors/multiplyTotal'
import { defineModifier } from '../registry'

export const multiplyTotalModifier: ModifierDefinition<number> = defineModifier(
  multiplyTotalSchema,
  multiplyTotalBehavior
)

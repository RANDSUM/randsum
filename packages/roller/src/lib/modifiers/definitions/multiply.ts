import type { ModifierDefinition } from '../schema'
import { multiplySchema } from '@randsum/notation/schemas'
import { multiplyBehavior } from '../behaviors/multiply'

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...multiplyBehavior
}

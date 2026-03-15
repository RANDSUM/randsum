import type { ModifierDefinition } from '../schema'
import { multiplySchema } from '@randsum/notation'
import { multiplyBehavior } from '../behaviors/multiply'

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...multiplyBehavior
}

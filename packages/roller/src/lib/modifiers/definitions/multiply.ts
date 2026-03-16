import type { ModifierDefinition } from '../schema'
import { multiplySchema } from '../../../notation/definitions/multiply'
import { multiplyBehavior } from '../behaviors/multiply'

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...multiplyBehavior
}

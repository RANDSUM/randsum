import type { ModifierDefinition } from '../schema'
import { wildDieSchema } from '../../../notation/definitions/wildDie'
import { wildDieBehavior } from '../behaviors/wildDie'

export const wildDieModifier: ModifierDefinition<boolean> = {
  ...wildDieSchema,
  ...wildDieBehavior
}

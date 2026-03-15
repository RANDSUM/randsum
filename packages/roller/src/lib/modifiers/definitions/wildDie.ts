import type { ModifierDefinition } from '../schema'
import { wildDieSchema } from '@randsum/notation'
import { wildDieBehavior } from '../behaviors/wildDie'

export const wildDieModifier: ModifierDefinition<boolean> = {
  ...wildDieSchema,
  ...wildDieBehavior
}

import type { RerollOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { rerollSchema } from '@randsum/notation/schemas'
import { rerollBehavior } from '../behaviors/reroll'

export const rerollModifier: ModifierDefinition<RerollOptions> = {
  ...rerollSchema,
  ...rerollBehavior
}

import type { RerollOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { rerollSchema } from '@randsum/notation'
import { rerollBehavior } from '../behaviors/reroll'
import { defineModifier } from '../registry'

export const rerollModifier: ModifierDefinition<RerollOptions> = defineModifier(
  rerollSchema,
  rerollBehavior
)

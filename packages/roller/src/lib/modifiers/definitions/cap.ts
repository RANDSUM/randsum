import type { ComparisonOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { capSchema } from '@randsum/notation/schemas'
import { capBehavior } from '../behaviors/cap'
import { defineModifier } from '../registry'

export const capModifier: ModifierDefinition<ComparisonOptions> = defineModifier(
  capSchema,
  capBehavior
)

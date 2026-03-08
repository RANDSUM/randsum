import type { ComparisonOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { capSchema } from '../../notation/definitions/cap'
import { capBehavior } from '../behaviors/cap'
import { defineModifier } from '../registry'

export const capModifier: ModifierDefinition<ComparisonOptions> = defineModifier(
  capSchema,
  capBehavior
)

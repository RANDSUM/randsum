import type { ComparisonOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { capSchema } from '@randsum/notation'
import { capBehavior } from '../behaviors/cap'

export const capModifier: ModifierDefinition<ComparisonOptions> = {
  ...capSchema,
  ...capBehavior
}

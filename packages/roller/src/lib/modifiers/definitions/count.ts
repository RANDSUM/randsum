import type { CountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countSchema } from '@randsum/notation'
import { countBehavior } from '../behaviors/count'

export const countModifier: ModifierDefinition<CountOptions> = {
  ...countSchema,
  ...countBehavior
}

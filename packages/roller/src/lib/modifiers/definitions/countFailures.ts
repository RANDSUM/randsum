import type { CountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countFailuresSchema } from '@randsum/notation'
import { countFailuresBehavior } from '../behaviors/countFailures'

export const countFailuresModifier: ModifierDefinition<CountOptions> = {
  ...countFailuresSchema,
  ...countFailuresBehavior
}

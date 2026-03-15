import type { FailureCountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countFailuresSchema } from '@randsum/notation'
import { countFailuresBehavior } from '../behaviors/countFailures'

export const countFailuresModifier: ModifierDefinition<FailureCountOptions> = {
  ...countFailuresSchema,
  ...countFailuresBehavior
}

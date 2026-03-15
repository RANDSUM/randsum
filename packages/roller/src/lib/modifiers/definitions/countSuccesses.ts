import type { SuccessCountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countSuccessesSchema } from '@randsum/notation'
import { countSuccessesBehavior } from '../behaviors/countSuccesses'

export const countSuccessesModifier: ModifierDefinition<SuccessCountOptions> = {
  ...countSuccessesSchema,
  ...countSuccessesBehavior
}

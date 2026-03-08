import type { SuccessCountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countSuccessesSchema } from '../../notation/definitions/countSuccesses'
import { countSuccessesBehavior } from '../behaviors/countSuccesses'
import { defineModifier } from '../registry'

export const countSuccessesModifier: ModifierDefinition<SuccessCountOptions> = defineModifier(
  countSuccessesSchema,
  countSuccessesBehavior
)

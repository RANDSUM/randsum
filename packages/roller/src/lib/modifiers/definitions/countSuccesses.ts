import type { CountOptions } from '../../../types'
import type { ModifierDefinition } from '../schema'
import { countSuccessesSchema } from '../../../notation/definitions/countSuccesses'
import { countSuccessesBehavior } from '../behaviors/countSuccesses'

export const countSuccessesModifier: ModifierDefinition<CountOptions> = {
  ...countSuccessesSchema,
  ...countSuccessesBehavior
}

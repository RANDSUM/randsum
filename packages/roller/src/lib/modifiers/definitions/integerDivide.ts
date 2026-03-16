import type { ModifierDefinition } from '../schema'
import { integerDivideSchema } from '../../../notation/definitions/integerDivide'
import { integerDivideBehavior } from '../behaviors/integerDivide'

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  ...integerDivideBehavior
}

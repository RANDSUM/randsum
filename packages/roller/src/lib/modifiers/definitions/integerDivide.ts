import type { ModifierDefinition } from '../schema'
import { integerDivideSchema } from '@randsum/notation'
import { integerDivideBehavior } from '../behaviors/integerDivide'

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  ...integerDivideBehavior
}

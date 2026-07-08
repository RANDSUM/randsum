import { integerDivideSchema } from '../notation/definitions/integerDivide'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const integerDivideModifier: ModifierDefinition<number> = {
  ...integerDivideSchema,
  ...createScaleBehavior((total, value) => Math.trunc(total / value))
}

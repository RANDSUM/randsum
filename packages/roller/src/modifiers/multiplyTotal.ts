import { multiplyTotalSchema } from '../notation/definitions/multiplyTotal'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const multiplyTotalModifier: ModifierDefinition<number> = {
  ...multiplyTotalSchema,
  ...createScaleBehavior((total, value) => total * value)
}

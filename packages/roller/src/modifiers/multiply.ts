import { multiplySchema } from '../notation/definitions/multiply'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const multiplyModifier: ModifierDefinition<number> = {
  ...multiplySchema,
  ...createScaleBehavior((total, value) => total * value)
}

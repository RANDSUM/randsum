import { minusSchema } from '../notation/definitions/minus'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const minusModifier: ModifierDefinition<number> = {
  ...minusSchema,
  ...createScaleBehavior((total, value) => total - value)
}

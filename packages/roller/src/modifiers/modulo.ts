import { moduloSchema } from '../notation/definitions/modulo'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...createScaleBehavior((total, value) => total % value)
}

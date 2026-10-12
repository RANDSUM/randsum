import { moduloSchema } from '../notation/definitions/modulo'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior, rejectZeroDivisor } from './shared/scale'

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...createScaleBehavior((total, value) => total % value),
  validate: rejectZeroDivisor('modulo')
}

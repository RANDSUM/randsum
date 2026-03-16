import type { ModifierDefinition } from '../schema'
import { moduloSchema } from '../../../notation/definitions/modulo'
import { moduloBehavior } from '../behaviors/modulo'

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...moduloBehavior
}

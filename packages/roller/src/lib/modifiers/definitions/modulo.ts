import type { ModifierDefinition } from '../schema'
import { moduloSchema } from '@randsum/notation'
import { moduloBehavior } from '../behaviors/modulo'

export const moduloModifier: ModifierDefinition<number> = {
  ...moduloSchema,
  ...moduloBehavior
}

import type { ModifierDefinition } from '../schema'
import { plusSchema } from '@randsum/notation/schemas'
import { plusBehavior } from '../behaviors/arithmetic'

export const plusModifier: ModifierDefinition<number> = {
  ...plusSchema,
  ...plusBehavior
}

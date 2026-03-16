import type { ModifierDefinition } from '../schema'
import { plusSchema } from '../../../notation/definitions/plus'
import { plusBehavior } from '../behaviors/arithmetic'

export const plusModifier: ModifierDefinition<number> = {
  ...plusSchema,
  ...plusBehavior
}

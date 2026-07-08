import { plusSchema } from '../notation/definitions/plus'
import type { ModifierDefinition } from './schema'
import { createScaleBehavior } from './shared/scale'

export const plusModifier: ModifierDefinition<number> = {
  ...plusSchema,
  ...createScaleBehavior((total, value) => total + value)
}

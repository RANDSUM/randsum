import type { ModifierDefinition } from '../schema'
import { multiplySchema } from '@randsum/notation'
import { multiplyBehavior } from '../behaviors/multiply'
import { defineModifier } from '../registry'

export const multiplyModifier: ModifierDefinition<number> = defineModifier(
  multiplySchema,
  multiplyBehavior
)

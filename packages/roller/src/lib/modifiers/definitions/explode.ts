import type { ModifierDefinition } from '../schema'
import { explodeSchema } from '@randsum/notation'
import { explodeBehavior } from '../behaviors/explode'
import { defineModifier } from '../registry'

export const explodeModifier: ModifierDefinition<boolean | number> = defineModifier(
  explodeSchema,
  explodeBehavior
)

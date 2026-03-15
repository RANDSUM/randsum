import type { ModifierDefinition } from '../schema'
import { explodeSchema } from '@randsum/notation'
import { explodeBehavior } from '../behaviors/explode'

export const explodeModifier: ModifierDefinition<boolean | number> = {
  ...explodeSchema,
  ...explodeBehavior
}

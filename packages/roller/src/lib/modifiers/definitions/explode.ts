import type { ModifierDefinition } from '../schema'
import { explodeSchema } from '../../../notation/definitions/explode'
import { explodeBehavior } from '../behaviors/explode'

export const explodeModifier: ModifierDefinition<boolean> = {
  ...explodeSchema,
  ...explodeBehavior
}

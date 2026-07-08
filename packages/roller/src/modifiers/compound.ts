import type { ComparisonOptions } from '../notation/types'
import { compoundSchema } from '../notation/definitions/compound'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

export const compoundModifier: ModifierDefinition<boolean | number | ComparisonOptions> = {
  ...compoundSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.compound)
}

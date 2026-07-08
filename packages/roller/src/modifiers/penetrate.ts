import type { ComparisonOptions } from '../notation/types'
import { penetrateSchema } from '../notation/definitions/penetrate'
import type { ModifierDefinition } from './schema'
import { ExplosionStrategies, createAccumulatingExplosionBehavior } from './shared/explosion'

export const penetrateModifier: ModifierDefinition<boolean | number | ComparisonOptions> = {
  ...penetrateSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: createAccumulatingExplosionBehavior(ExplosionStrategies.penetrate)
}

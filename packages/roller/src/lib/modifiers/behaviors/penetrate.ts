import type { ModifierBehavior } from '../schema'
import { assertRequiredContext } from '../schema'
import {
  ExplosionStrategies,
  applyAccumulatingExplosion,
  resolveExplosionDepth
} from '../definitions/explosion'

export const penetrateBehavior: ModifierBehavior<boolean | number> = {
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const { sides } = parameters
    const maxDepth = resolveExplosionDepth(options)

    const result = rolls.map(roll =>
      roll === sides
        ? applyAccumulatingExplosion(roll, sides, rollOne, maxDepth, ExplosionStrategies.penetrate)
        : roll
    )

    return { rolls: result }
  }
}

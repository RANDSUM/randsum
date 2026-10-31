import type { ComparisonOptions } from '../notation/types'
import { DEFAULT_EXPLOSION_DEPTH } from '../lib/constants'
import { explodeSchema } from '../notation/definitions/explode'
import type { ModifierDefinition } from './schema'
import { assertRequiredContext } from './schema'
import { buildExplosionTrigger } from './shared/conditionMatch'

export const explodeModifier: ModifierDefinition<boolean | ComparisonOptions> = {
  ...explodeSchema,
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const trigger = buildExplosionTrigger(options)
    const { sides } = parameters
    // Each triggering die starts a chain: a new die that also triggers explodes
    // again, up to DEFAULT_EXPLOSION_DEPTH new dice per original die (RDN §9.1).
    const chain = (depth: number): number[] => {
      if (depth >= DEFAULT_EXPLOSION_DEPTH) return []
      const next = rollOne()
      return trigger(next, sides) ? [next, ...chain(depth + 1)] : [next]
    }
    const explosions = rolls.filter(roll => trigger(roll, sides)).flatMap(() => chain(0))

    return { rolls: [...rolls, ...explosions] }
  }
}

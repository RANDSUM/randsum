import type { ComparisonOptions } from '../notation/types'
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
    const explosions = rolls.filter(roll => trigger(roll, parameters.sides)).map(() => rollOne())

    return { rolls: [...rolls, ...explosions] }
  }
}

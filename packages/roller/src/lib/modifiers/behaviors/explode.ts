import type { ModifierBehavior } from '../schema'
import { assertRequiredContext } from '../schema'

export const explodeBehavior: ModifierBehavior<boolean | number> = {
  requiresRollFn: true,
  requiresParameters: true,

  apply: (rolls, _options, ctx) => {
    const { rollOne, parameters } = assertRequiredContext(ctx)
    const explosions = rolls.filter(roll => roll === parameters.sides).map(() => rollOne())

    return { rolls: [...rolls, ...explosions] }
  }
}

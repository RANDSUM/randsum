import type { CountOptions } from '../../../types'
import type { ModifierBehavior } from '../schema'

export const countFailuresBehavior: ModifierBehavior<CountOptions> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        const threshold = options.lessThanOrEqual
        if (threshold === undefined) return 0
        return currentRolls.filter(roll => roll <= threshold).length
      }
    }
  }
}

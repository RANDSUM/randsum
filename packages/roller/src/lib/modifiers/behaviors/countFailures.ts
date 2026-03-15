import type { FailureCountOptions } from '../../../types'
import type { ModifierBehavior } from '../schema'

export const countFailuresBehavior: ModifierBehavior<FailureCountOptions> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        return currentRolls.filter(roll => roll <= options.threshold).length
      }
    }
  }
}

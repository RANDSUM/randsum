import type { SuccessCountOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import type { ModifierBehavior } from '../schema'

export const countSuccessesBehavior: ModifierBehavior<SuccessCountOptions> = {
  validate: options => {
    if (options.botchThreshold !== undefined && options.botchThreshold >= options.threshold) {
      throw new ModifierError(
        'countSuccesses',
        `botchThreshold (${options.botchThreshold}) must be less than threshold (${options.threshold})`
      )
    }
  },

  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        const successCount = currentRolls.filter(roll => roll >= options.threshold).length
        const { botchThreshold } = options
        const botchCount =
          botchThreshold !== undefined
            ? currentRolls.filter(roll => roll <= botchThreshold).length
            : 0
        return successCount - botchCount
      }
    }
  }
}

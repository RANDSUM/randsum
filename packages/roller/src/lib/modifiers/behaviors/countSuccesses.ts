import type { CountOptions } from '../../../types'
import { ModifierError } from '../../../errors'
import type { ModifierBehavior } from '../schema'

export const countSuccessesBehavior: ModifierBehavior<CountOptions> = {
  validate: options => {
    if (
      options.deduct &&
      options.lessThanOrEqual !== undefined &&
      options.greaterThanOrEqual !== undefined &&
      options.lessThanOrEqual >= options.greaterThanOrEqual
    ) {
      throw new ModifierError(
        'countSuccesses',
        `botchThreshold (${options.lessThanOrEqual}) must be less than threshold (${options.greaterThanOrEqual})`
      )
    }
  },

  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: (_total, currentRolls) => {
        const threshold = options.greaterThanOrEqual
        const successCount =
          threshold !== undefined ? currentRolls.filter(roll => roll >= threshold).length : 0
        const botchThreshold = options.deduct ? options.lessThanOrEqual : undefined
        const botchCount =
          botchThreshold !== undefined
            ? currentRolls.filter(roll => roll <= botchThreshold).length
            : 0
        return successCount - botchCount
      }
    }
  }
}

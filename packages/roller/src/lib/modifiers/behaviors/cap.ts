import { validateComparisonOptions } from '../../comparison'
import type { ModifierBehavior } from '../schema'
import type { ComparisonOptions } from '../../../types'

export const capBehavior: ModifierBehavior<ComparisonOptions> = {
  apply: (rolls, options) => {
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } = options
    const newRolls = rolls.map(roll => {
      const afterHighCap =
        greaterThan !== undefined && roll > greaterThan
          ? greaterThan
          : greaterThanOrEqual !== undefined && roll >= greaterThanOrEqual
            ? greaterThanOrEqual
            : roll

      const afterExactCap = (exact ?? []).reduce((v, cap) => (v > cap ? cap : v), afterHighCap)

      const afterLowCap =
        lessThan !== undefined && afterExactCap < lessThan
          ? lessThan
          : lessThanOrEqual !== undefined && afterExactCap <= lessThanOrEqual
            ? lessThanOrEqual
            : afterExactCap

      return afterLowCap
    })

    return { rolls: newRolls }
  },

  validate: options => {
    validateComparisonOptions('cap', options)
  }
}

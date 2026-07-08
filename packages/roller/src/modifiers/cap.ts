import type { ComparisonOptions } from '../notation/types'
import { capSchema } from '../notation/definitions/cap'
import type { ModifierDefinition } from './schema'

export const capModifier: ModifierDefinition<ComparisonOptions> = {
  ...capSchema,

  apply: (rolls, options) => {
    const { greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual, exact } = options
    const newRolls = rolls.map(roll => {
      const afterHighCap =
        greaterThan !== undefined && roll > greaterThan
          ? greaterThan
          : greaterThanOrEqual !== undefined && roll >= greaterThanOrEqual
            ? greaterThanOrEqual
            : roll

      // Gap 41: C{N} (bare integer) is parsed as `exact: [N]` internally.
      // Despite the name "exact", the apply logic here implements max-cap semantics:
      // clamp DOWN to `cap` if v > cap. This is correct behavior for "no result exceeds N".
      // The `exact` representation is an internal detail; consumers should treat C{N} as a ceiling cap.
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

  validate: _options => {
    // Cap uses clamping semantics (floor/ceiling), not filter semantics.
    // Any combination of lessThan/greaterThan is valid — no impossible range exists.
  }
}

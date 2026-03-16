import type { ModifierBehavior } from '../schema'

export const integerDivideBehavior: ModifierBehavior<number> = {
  mutatesRolls: false,
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => Math.trunc(total / options)
    }
  }
}

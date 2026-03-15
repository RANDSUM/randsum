import type { ModifierBehavior } from '../schema'

export const integerDivideBehavior: ModifierBehavior<number> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => Math.trunc(total / options)
    }
  }
}

import type { ModifierBehavior } from '../schema'

export const multiplyTotalBehavior: ModifierBehavior<number> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total * options
    }
  }
}

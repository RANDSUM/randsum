import type { ModifierBehavior } from '../schema'

export const multiplyBehavior: ModifierBehavior<number> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total * options
    }
  }
}

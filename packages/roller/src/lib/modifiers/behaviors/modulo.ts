import type { ModifierBehavior } from '../schema'

export const moduloBehavior: ModifierBehavior<number> = {
  apply: (rolls, options) => {
    return {
      rolls,
      transformTotal: total => total % options
    }
  }
}

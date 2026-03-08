import type { ModifierBehavior } from '../schema'

export function createArithmeticBehavior(operator: '+' | '-'): ModifierBehavior<number> {
  return {
    apply: (rolls, options) => {
      return {
        rolls,
        transformTotal: total => (operator === '+' ? total + options : total - options)
      }
    }
  }
}

export const plusBehavior: ModifierBehavior<number> = createArithmeticBehavior('+')
export const minusBehavior: ModifierBehavior<number> = createArithmeticBehavior('-')

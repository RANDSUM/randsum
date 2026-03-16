import type { ModifierBehavior } from '../schema'

function createArithmeticBehavior(operator: '+' | '-'): ModifierBehavior<number> {
  return {
    mutatesRolls: false,
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

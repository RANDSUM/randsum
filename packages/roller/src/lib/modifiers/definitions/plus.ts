import type { TypedModifierDefinition } from '../schema'
import { createArithmeticModifier } from './arithmetic'

/**
 * Plus modifier - adds a fixed value to the total.
 *
 * Notation: +N (can appear multiple times, values are accumulated)
 * Examples:
 *   - 1d20+5 - Roll 1d20, add 5 to the total
 *   - 2d6+3+2 - Roll 2d6, add 5 to the total (3+2)
 */
export const plusModifier: TypedModifierDefinition<'plus'> = createArithmeticModifier({
  name: 'plus',
  priority: 90,
  operator: '+',
  verb: 'Add'
})

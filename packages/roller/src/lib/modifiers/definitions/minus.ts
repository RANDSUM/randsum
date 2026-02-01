import type { TypedModifierDefinition } from '../schema'
import { createArithmeticModifier } from './arithmetic'

/**
 * Minus modifier - subtracts a fixed value from the total.
 *
 * Notation: -N (can appear multiple times, values are accumulated)
 * Examples:
 *   - 1d20-2 - Roll 1d20, subtract 2 from the total
 *   - 2d6-1-2 - Roll 2d6, subtract 3 from the total (1+2)
 */
export const minusModifier: TypedModifierDefinition<'minus'> = createArithmeticModifier({
  name: 'minus',
  priority: 91, // Just after plus
  operator: '-',
  verb: 'Subtract'
})

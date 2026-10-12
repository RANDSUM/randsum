import { ModifierError } from '../../errors'
import type { ModifierApplyResult, ModifierBehavior } from '../schema'

/**
 * Factory for Scale-verb (arithmetic) modifiers.
 *
 * All Scale modifiers share the same pattern:
 * - Do not mutate the rolls array
 * - Return a transformTotal function that applies a binary operation to (total, value)
 *
 * @param op - Binary operation (total, value) => newTotal
 * @returns A ModifierBehavior<number> with mutatesRolls: false and the apply function
 */
export function createScaleBehavior(
  op: (total: number, value: number) => number
): ModifierBehavior<number> & { readonly mutatesRolls: false } {
  return {
    mutatesRolls: false as const,
    apply: (rolls: number[], options: number): ModifierApplyResult => ({
      rolls,
      transformTotal: (total: number) => op(total, options)
    })
  }
}

/**
 * Validator for the divisor-taking Scale modifiers (integerDivide, modulo).
 * Notation cannot spell a zero divisor, but an options object can, and dividing
 * by zero would otherwise return a NaN total.
 */
export function rejectZeroDivisor(name: string): (options: number) => void {
  return options => {
    if (options === 0) {
      throw new ModifierError(name, 'Cannot divide by zero', {
        path: `modifiers.${name}`,
        value: options
      })
    }
  }
}

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

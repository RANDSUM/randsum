/**
 * Asserts that a condition is true, throwing an error if not.
 *
 * Use this for runtime checks that should never fail in correct code.
 * Unlike regular assertions, invariant violations indicate programming errors.
 *
 * @param condition - The condition to check
 * @param message - Description of the invariant being violated
 * @throws Error if condition is false
 *
 * @example
 * ```ts
 * function getDieResult(sides: number, roll: number): number {
 *   invariant(roll >= 1 && roll <= sides, `Roll ${roll} out of range for d${sides}`)
 *   return roll
 * }
 * ```
 */
export function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`)
  }
}

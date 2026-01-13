import type { RollerRollResult } from '@randsum/roller'

/**
 * Asserts that a roll result's total is within the expected range.
 *
 * @param result - The roll result to check
 * @param min - Minimum expected value (inclusive)
 * @param max - Maximum expected value (inclusive)
 * @throws Error if the total is outside the range
 */
export function expectRollInRange(result: RollerRollResult, min: number, max: number): void {
  if (result.total < min || result.total > max) {
    throw new Error(`Expected roll total to be between ${min} and ${max}, but got ${result.total}`)
  }
}

/**
 * Asserts that all individual rolls in a result are within the expected range.
 *
 * @param result - The roll result to check
 * @param min - Minimum expected value (inclusive)
 * @param max - Maximum expected value (inclusive)
 * @throws Error if any roll is outside the range
 */
export function expectAllRollsInRange(result: RollerRollResult, min: number, max: number): void {
  for (const rollRecord of result.rolls) {
    for (const roll of rollRecord.rolls) {
      if (roll < min || roll > max) {
        throw new Error(`Expected roll to be between ${min} and ${max}, but got ${roll}`)
      }
    }
  }
}


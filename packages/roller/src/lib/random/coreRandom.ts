import type { RandomFn } from '../../types/core'

export type { RandomFn } from '../../types/core'

/**
 * Generates a random integer from 0 to max-1 (exclusive).
 *
 * Note: Uses bitwise OR (`| 0`) for integer truncation.
 * This is equivalent to `Math.floor()` for positive numbers
 * but is slightly faster in tight loops.
 *
 * @param max - Upper bound (exclusive)
 * @param rng - Random number generator (default: Math.random)
 * @returns Random integer in range [0, max)
 */
export function coreRandom(max: number, rng: RandomFn = Math.random): number {
  return (rng() * max) | 0
}

import type { RandomFn } from '../../types/core'

export type { RandomFn } from '../../types/core'

/**
 * Generates a random integer from 0 to max-1 (exclusive).
 *
 * @param max - Upper bound (exclusive)
 * @param rng - Random number generator (default: Math.random)
 * @returns Random integer in range [0, max)
 */
export function coreRandom(max: number, rng: RandomFn = Math.random): number {
  return Math.floor(rng() * max)
}

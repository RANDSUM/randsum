import type { RandomFn } from '../../src/lib/random'

/**
 * Creates a deterministic random number generator from a seed.
 *
 * Uses a linear congruential generator (LCG) algorithm to produce
 * pseudo-random numbers. The same seed will always produce the same
 * sequence of numbers, making it useful for deterministic testing.
 *
 * @param seed - Initial seed value (any integer)
 * @returns A function that returns pseudo-random numbers between 0 (inclusive) and 1 (exclusive)
 *
 * @example
 * ```ts
 * const rng1 = createSeededRandom(42)
 * const rng2 = createSeededRandom(42)
 *
 * // Both will produce the same sequence
 * console.log(rng1()) // Same value
 * console.log(rng2()) // Same value
 * ```
 */
export function createSeededRandom(seed: number): RandomFn {
  let currentSeed = seed

  return (): number => {
    // LCG parameters (same as used in many standard libraries)
    currentSeed = (currentSeed * 1664525 + 1013904223) % 2 ** 32
    return currentSeed / 2 ** 32
  }
}

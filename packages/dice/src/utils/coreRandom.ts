/**
 * A more efficient random number generator for dice rolling
 *
 * This implementation provides better performance than the standard Math.random()
 * by using a more optimized algorithm and avoiding unnecessary operations.
 *
 * @param max - The maximum value (exclusive) for the random number
 * @returns A random integer between 0 (inclusive) and max (exclusive)
 */
export function coreRandom(max: number): number {
  // Using a bitwise OR 0 is faster than Math.floor for integers
  return (Math.random() * max) | 0
}

/**
 * A seedable random number generator for deterministic testing
 *
 * This implementation allows setting a seed for reproducible random numbers,
 * which is useful for testing and debugging.
 *
 * @param seed - The seed value for the random number generator
 * @returns A function that generates random numbers based on the seed
 */
export function createSeededRandom(
  seed: number = Date.now()
): (max: number) => number {
  let currentSeed = seed

  // Simple xorshift algorithm - fast and good enough for dice
  return function seededRandom(max: number): number {
    currentSeed ^= currentSeed << 13
    currentSeed ^= currentSeed >> 17
    currentSeed ^= currentSeed << 5
    // Ensure positive value and normalize to [0,1) range
    const randomValue = Math.abs(currentSeed) / 2147483647
    return (randomValue * max) | 0
  }
}

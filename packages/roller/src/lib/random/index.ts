/**
 * Core random number generator
 * Returns a random integer from 0 to max-1 (inclusive)
 * 
 * @param max - The upper bound (exclusive)
 * @returns A random integer between 0 and max-1
 */
export function coreRandom(max: number): number {
  return Math.floor(Math.random() * max)
}

/**
 * Generate an array of random dice rolls
 * Each roll is a random integer from 1 to max (inclusive)
 * 
 * @param quantity - The number of dice to roll
 * @param max - The number of sides on each die
 * @returns An array of rolled values
 */
export function coreSpreadRolls(quantity: number, max: number): number[] {
  const rolls: number[] = []
  
  for (let i = 0; i < quantity; i++) {
    rolls.push(coreRandom(max) + 1)
  }
  
  return rolls
}


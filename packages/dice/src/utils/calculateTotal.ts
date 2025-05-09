/**
 * Calculates the total value of a set of rolls
 *
 * @param rolls - Array of roll results (either numbers or strings)
 * @param bonus - Optional bonus to add to the total (default: 0 for numbers, '' for strings)
 * @returns The total value (sum for numbers, joined string for strings)
 */
export function calculateTotal(rolls: number[], bonus?: number): number;
export function calculateTotal(rolls: string[], bonus?: string): string;
export function calculateTotal(
  rolls: (string | number)[],
  bonus: string | number = 0
): string | number {
  if (rolls.every((roll) => typeof roll === 'number')) {
    // Now TypeScript knows all rolls are numbers
    const numericRolls = rolls as number[]
    const numericBonus = bonus as number
    return numericRolls.reduce((acc, cur) => acc + cur, numericBonus)
  }

  return rolls.flat().join(', ')
}

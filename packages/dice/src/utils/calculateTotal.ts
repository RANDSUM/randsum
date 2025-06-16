/**
 * Calculates the total value from an array of roll results
 *
 * This function handles both numeric and string roll results.
 * For numeric rolls, it sums all values and adds any bonus.
 * For string/custom dice results, it joins them into a comma-separated string.
 *
 * @param rolls - Array of individual roll results (numbers or strings)
 * @param bonus - Optional bonus to add to numeric totals (default: 0)
 *
 * @returns Sum of numeric rolls plus bonus, or comma-separated string for custom dice
 *
 * @example
 * // Numeric rolls
 * calculateTotal([4, 6, 2], 3) // Returns: 15 (4+6+2+3)
 *
 * @example
 * // Custom dice faces
 * calculateTotal(['H', 'T', 'H']) // Returns: "H, T, H"
 *
 * @example
 * // No bonus
 * calculateTotal([1, 6, 3]) // Returns: 10
 *
 * @internal
 */
export function calculateTotal(
  rolls: (string | number)[],
  bonus: string | number = 0
): string | number {
  if (rolls.every((roll) => typeof roll === 'number')) {
    return rolls.reduce((acc, cur) => (acc as number) + cur, bonus)
  }

  return rolls.flat().join(', ')
}

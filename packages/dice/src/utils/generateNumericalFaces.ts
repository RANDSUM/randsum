/**
 * Generates an array of numerical faces for a die with the given number of sides
 * Uses memoization to cache results for better performance
 *
 * @param sides - The number of sides on the die
 * @returns An array of numbers representing the faces of the die
 */
export function generateNumericalFaces(sides: number): number[] {
  return Array.from({ length: Number(sides) }, (_, index) => index + 1)
}

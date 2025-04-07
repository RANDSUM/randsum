/**
 * Cache for storing pre-generated dice faces to avoid redundant calculations
 * This significantly improves performance for frequently used dice (d4, d6, d8, d10, d12, d20)
 */
const facesCache = new Map<number, number[]>()

/**
 * Generates an array of numerical faces for a die with the given number of sides
 * Uses memoization to cache results for better performance
 *
 * @param sides - The number of sides on the die
 * @returns An array of numbers representing the faces of the die
 */
export function generateNumericalFaces(sides: number): number[] {
  const numSides = Number(sides)

  if (facesCache.has(numSides)) {
    const cachedFaces = facesCache.get(numSides)
    if (cachedFaces === undefined) {
      throw new Error('Faces cache is empty')
    }
    return cachedFaces
  }

  const faces = Array.from({ length: numSides }, (_, index) => index + 1)

  if (numSides <= 100 || [4, 6, 8, 10, 12, 20, 100].includes(numSides)) {
    facesCache.set(numSides, faces)
  }

  return faces
}

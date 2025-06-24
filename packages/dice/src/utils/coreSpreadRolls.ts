import { coreRandom } from './coreRandom'
import { generateNumericalFaces } from './generateNumericalFaces'

/**
 * Generates an array of dice roll results
 *
 * @param quantity - The number of dice to roll
 * @param max - The maximum value (number of sides) for each die
 * @param faces - Optional array of custom face values
 * @returns An array of roll results
 */
export function coreSpreadRolls<F extends string | number>(
  quantity: number,
  max: number,
  faces?: string[]
): F[] {
  const facesArr = faces ?? (generateNumericalFaces(max))

  const result = new Array<F>(quantity)

  for (let i = 0; i < quantity; i++) {
    const randomIndex = coreRandom(max)
    const face = facesArr[randomIndex]
    if (face) {
      result[i] = face as F
    }
  }

  return result
}

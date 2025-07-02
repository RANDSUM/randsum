import { coreRandom } from './coreRandom'
import { generateNumericFaces } from './generateNumericFaces'

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
  faces?: F[]
): F[] {
  const facesArr = (faces ?? generateNumericFaces(max)) as F[]

  const result = new Array<F>(quantity)

  for (let i = 0; i < quantity; i++) {
    const randomIndex = coreRandom(max)
    const face = facesArr[randomIndex]
    if (face) {
      result[i] = face
    }
  }

  return result
}

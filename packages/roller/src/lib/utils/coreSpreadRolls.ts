import { coreRandom } from './coreRandom'
import { generateNumericFaces } from './generateNumericFaces'

export function coreSpreadRolls(quantity: number, max: number): number[] {
  const facesArr = generateNumericFaces(max)

  const result = new Array<number>(quantity)

  for (let i = 0; i < quantity; i++) {
    const randomIndex = coreRandom(max)
    const face = facesArr[randomIndex]
    if (face) {
      result[i] = face
    }
  }

  return result
}

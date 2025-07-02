import { coreRandom } from './coreRandom'
import { generateNumericFaces } from './generateNumericFaces'

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

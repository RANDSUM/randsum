import { coreRandom } from './coreRandom'

export function coreSpreadRolls(quantity: number, max: number): number[] {
  const faces = Array.from({ length: max }, (_, index) => index + 1)
  const result = new Array<number>(quantity)

  for (let i = 0; i < quantity; i++) {
    const randomIndex = coreRandom(max)
    const face = faces[randomIndex]
    if (face) {
      result[i] = face
    }
  }

  return result
}

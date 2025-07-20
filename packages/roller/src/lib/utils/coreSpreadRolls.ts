import { coreRandom } from './coreRandom'

export function coreSpreadRolls(quantity: number, max: number): number[] {
  const result = new Array<number>(quantity)

  for (let i = 0; i < quantity; i++) {
    result[i] = coreRandom(max) + 1
  }

  return result
}

import { coreRandom } from './coreRandom'

export function coreSpreadRolls(quantity: number, max: number): number[] {
  return Array.from({ length: quantity }, () => coreRandom(max))
}

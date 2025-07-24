import { coreRandom } from './coreRandom'

export function coreSpreadRolls(quantity: number, max: number): number[] {
  if (quantity <= 0) return []

  return Array.from({ length: quantity }, () => coreRandom(max) + 1)
}

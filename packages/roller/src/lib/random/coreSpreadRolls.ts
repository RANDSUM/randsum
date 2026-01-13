import type { RandomFn } from './coreRandom'
import { coreRandom } from './coreRandom'

export function coreSpreadRolls(quantity: number, max: number, rng?: RandomFn): number[] {
  if (quantity <= 0) return []

  return Array.from({ length: quantity }, () => coreRandom(max, rng) + 1)
}

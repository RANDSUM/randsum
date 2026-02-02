import type { FifthAdvantageDisadvantage } from '../types'

export function generateQuantity({
  advantage,
  disadvantage
}: FifthAdvantageDisadvantage = {}): number {
  if ((advantage && disadvantage) || (!advantage && !disadvantage)) {
    return 1
  }
  return 2
}

import type { FifthAdvantageDisadvantage } from '../types'

export function generateQuantity({
  advantage,
  disadvantage
}: FifthAdvantageDisadvantage = {}): 1 | 2 {
  if ((advantage && disadvantage) || (!advantage && !disadvantage)) {
    return 1
  }
  return 2
}

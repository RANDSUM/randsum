import type { DaggerheartAdvantageDisadvantage } from '../types'
import { advantageDie } from './advantageDie'

export function calculateTotal(
  total: number,
  rollingWith: DaggerheartAdvantageDisadvantage | undefined
): [number, number | undefined] {
  if (rollingWith) {
    const advantage = advantageDie()
    if (rollingWith === 'Advantage') {
      return [total + advantage, advantage]
    }
    return [total - advantage, -advantage]
  }
  return [total, undefined]
}

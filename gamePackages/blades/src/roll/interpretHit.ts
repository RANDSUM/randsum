import type { RollerRollResult } from '@randsum/roller'
import type { BladesResult } from '../types'

export function interpretHit({ rolls }: RollerRollResult, canCrit: boolean): BladesResult {
  const sortedRolls = rolls.flatMap(roll => roll.rolls)
  const sixes = sortedRolls.filter(r => r === 6).length
  if (sixes >= 2 && canCrit) {
    return 'critical'
  }

  switch (sortedRolls[0]) {
    case 6:
      return 'success'
    case 5:
    case 4:
      return 'partial'
    default:
      return 'failure'
  }
}

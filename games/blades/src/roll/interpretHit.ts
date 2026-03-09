import type { RollerRollResult } from '@randsum/roller'
import type { BladesResult } from '../types'

export function interpretHit({ rolls }: RollerRollResult, canCrit: boolean): BladesResult {
  const allRolls = rolls.flatMap(roll => roll.rolls)
  const sixes = allRolls.filter(r => r === 6).length
  if (sixes >= 2 && canCrit) {
    return 'critical'
  }

  switch (Math.max(...allRolls)) {
    case 6:
      return 'success'
    case 5:
    case 4:
      return 'partial'
    default:
      return 'failure'
  }
}

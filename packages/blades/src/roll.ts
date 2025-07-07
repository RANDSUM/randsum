import {
  type NumericRollOptions,
  type NumericRollResult,
  roll as coreRoll
} from '@randsum/roller'
import type { BladesResult } from './types'

function interpretHit(sortedRolls: number[], canCrit: boolean): BladesResult {
  const sixes = sortedRolls.filter((r) => r === 6).length
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

function generateOptions(count: number, canCrit: boolean): NumericRollOptions {
  if (canCrit) {
    return { sides: 6, quantity: count }
  }
  return { sides: 6, quantity: 2, modifiers: { drop: { highest: 1 } } }
}

export function roll(count: number): [BladesResult, NumericRollResult] {
  const canCrit = count > 0

  const rollResult = coreRoll(generateOptions(count, canCrit))
  const rolls = rollresult.rawRolls.flat().sort((a, b) => a - b)

  return [interpretHit(rolls, canCrit), rollResult]
}

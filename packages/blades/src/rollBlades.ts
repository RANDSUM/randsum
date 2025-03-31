import {
  roll,
  type NumericRollOptions,
  type NumericRollResult
} from '@randsum/dice'
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

export function rollBlades(count: number): [BladesResult, NumericRollResult] {
  const canCrit = count > 0

  const rollResult = roll(generateOptions(count, canCrit))
  const rolls = rollResult.result.flat().sort((a, b) => a - b)

  return [interpretHit(rolls, canCrit), rollResult]
}

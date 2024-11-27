import { roll as baseRoll, type RollResult } from '@randsum/tower'
import * as BladesTypes from './types'

function interpretHit(
  sortedRolls: number[],
  canCrit: boolean
): BladesTypes.Hit {
  const sixes = sortedRolls.filter((r) => r === 6).length
  if (sixes >= 2 && canCrit) {
    return BladesTypes.Hit.CRITICAL
  }

  switch (sortedRolls[0]) {
    case 6:
      return BladesTypes.Hit.SUCCESS
    case 5:
    case 4:
      return BladesTypes.Hit.PARTIAL
    default:
      return BladesTypes.Hit.FAILURE
  }
}

function roll(count: number): [BladesTypes.Hit, RollResult] {
  const canCrit = count > 0

  const options = canCrit
    ? { sides: 6, quantity: count }
    : { sides: 6, quantity: 2, modifiers: { drop: { highest: 1 } } }

  const rollResult = baseRoll(options)
  const rolls = rollResult.rawResult.flat().sort((a, b) => a - b)

  return [interpretHit(rolls, canCrit), rollResult]
}

export const Blades = { roll, interpretHit }
export * as BladesTypes from './types'

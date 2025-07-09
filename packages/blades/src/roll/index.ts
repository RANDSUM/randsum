import { roll as coreRoll } from '@randsum/roller'
import type { BladesRollResult } from '../types'
import { generateOptions } from './generateOptions'
import { interpretHit } from './interpretHit'

export function roll(count: number): BladesRollResult {
  const canCrit = count > 0

  const rollResult = coreRoll(generateOptions(count, canCrit))
  const rolls = rollResult.history.initialRolls.flat().sort((a, b) => a - b)

  const outcome = interpretHit(rolls, canCrit)

  return {
    outcome,
    roll: rollResult.total,
    rolls: rollResult.rolls,
    result: rollResult
  }
}

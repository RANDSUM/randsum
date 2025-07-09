import { roll as coreRoll } from '@randsum/roller'
import type { BladesRollResult } from '../types'
import { generateOptions } from './generateOptions'
import { interpretHit } from './interpretHit'

export function roll(count: number): BladesRollResult {
  const canCrit = count > 0

  const result = coreRoll(generateOptions(count, canCrit))
  const rolls = result.history.initialRolls.flat().sort((a, b) => a - b)

  const outcome = interpretHit(rolls, canCrit)

  return {
    outcome,
    result
  }
}

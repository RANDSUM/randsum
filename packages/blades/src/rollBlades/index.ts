import { roll as coreRoll } from '@randsum/roller'
import type { BladesRollResult } from '../types'
import { generateOptions } from './generateOptions'
import { interpretHit } from './interpretHit'

export function rollBlades(count: number): BladesRollResult {
  if (!Number.isInteger(count)) {
    throw new Error(`Blades dice pool must be an integer, received: ${count}`)
  }

  if (count < 0) {
    throw new Error(`Blades dice pool must be non-negative, received: ${count}`)
  }

  if (count > 10) {
    throw new Error(
      `Blades dice pool is unusually large (${count}). Maximum recommended is 10.`
    )
  }

  const canCrit = count > 0

  const baseResult = coreRoll(generateOptions(count, canCrit))
  const rolls = baseResult.rolls
    .map((roll) => roll.modifierHistory.initialRolls.sort((a, b) => a - b))
    .flat()

  const result = interpretHit(rolls, canCrit)

  return {
    result,
    rolls: [baseResult]
  }
}

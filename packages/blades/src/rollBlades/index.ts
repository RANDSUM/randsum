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

  const result = coreRoll(generateOptions(count, canCrit))
  const rolls = result.history.initialRolls.flat().sort((a, b) => a - b)

  const outcome = interpretHit(rolls, canCrit)

  return {
    outcome,
    result
  }
}

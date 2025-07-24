import type { RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { interpretHit } from './interpretHit'
import type { BladesResult } from '../types'

export function rollBlades(count: number): {
  result: BladesResult
  total: number
  rolls: RollRecord[]
} {
  if (!Number.isInteger(count)) {
    throw new Error(`Blades dice pool must be an integer, received: ${count}`)
  }

  if (count < 0) {
    throw new Error(`Blades dice pool must be non-negative, received: ${count}`)
  }

  if (count > 10) {
    throw new Error(`Blades dice pool is unusually large (${count}). Maximum recommended is 10.`)
  }
  const canCrit = count > 0
  const rollResult = roll({
    sides: 6,
    quantity: canCrit ? count : 2,
    ...(canCrit
      ? {}
      : {
          modifiers: { drop: { highest: 1 } }
        })
  })
  return {
    ...rollResult,
    result: interpretHit(rollResult, canCrit)
  }
}

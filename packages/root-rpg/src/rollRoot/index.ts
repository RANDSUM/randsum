import { roll as coreRoll } from '@randsum/roller'
import type { RootRpgRollResult } from '../types'
import { interpretResult } from './interpretResult'

export function rollRoot(bonus: number): RootRpgRollResult {
  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const result = coreRoll(args)

  return {
    outcome: interpretResult(result.total),
    roll: result.total,
    result
  }
}

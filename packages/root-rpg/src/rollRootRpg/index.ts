import type { RollRecord } from '@randsum/roller'
import { roll } from '@randsum/roller'
import type { GameRollResult } from '@randsum/shared'
import { validateFinite, validateRange } from '@randsum/shared'
import type { RootRpgRollResult } from '../types'
import { interpretResult } from './interpretResult'

export function rollRootRpg(
  bonus: number
): GameRollResult<RootRpgRollResult['hit'], undefined, RollRecord> {
  validateFinite(bonus, 'Root RPG bonus')
  validateRange(bonus, -20, 20, 'Root RPG bonus')

  const rollResult = roll({
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  })

  return {
    rolls: rollResult.rolls,
    total: rollResult.total,
    result: interpretResult(rollResult.total)
  }
}

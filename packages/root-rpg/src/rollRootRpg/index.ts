import { roll as coreRoll } from '@randsum/roller'
import type { RootRpgRollResult } from '../types'
import { interpretResult } from './interpretResult'

export function rollRootRpg(bonus: number): RootRpgRollResult {
  if (!Number.isFinite(bonus)) {
    throw new Error(
      `Root RPG bonus must be a finite number, received: ${bonus}`
    )
  }

  if (bonus < -20 || bonus > 20) {
    throw new Error(
      `Root RPG bonus is outside reasonable range (-20 to +20), received: ${bonus}`
    )
  }

  const args = {
    quantity: 2,
    sides: 6,
    modifiers: { plus: bonus }
  }

  const baseResult = coreRoll(args)

  return {
    ...baseResult,
    result: {
      hit: interpretResult(baseResult.total),
      total: baseResult.total
    }
  }
}

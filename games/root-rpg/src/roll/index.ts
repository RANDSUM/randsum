import { createGameRoll, validateFinite, validateRange } from '@randsum/roller'
import type { GameRollResult, RollRecord } from '@randsum/roller'
import type { RootRpgResult } from '../types'
import { interpretResult } from './interpretResult'

export const roll: (bonus: number) => GameRollResult<RootRpgResult, undefined, RollRecord> =
  createGameRoll<number, RootRpgResult>({
    validate: (bonus: number) => {
      validateFinite(bonus, 'Root RPG bonus')
      validateRange(bonus, -20, 20, 'Root RPG bonus')
    },
    toRollOptions: (bonus: number) => ({
      quantity: 2,
      sides: 6,
      modifiers: { plus: bonus }
    }),
    interpretResult: (_input: number, fullResult) => interpretResult(fullResult.total)
  })

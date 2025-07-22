import type { RollResult } from '@randsum/roller'
import { rollWrapper } from '@randsum/roller'
import type { RootRpgRollResult } from '../types'
import { interpretResult } from './interpretResult'

const rollRootRpg: (arg: number) => RollResult<RootRpgRollResult> = rollWrapper(
  {
    validateInput: (bonus: number) => {
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
      return bonus
    },
    toArg: (bonus: number) => [
      {
        quantity: 2,
        sides: 6,
        modifiers: { plus: bonus }
      }
    ],
    toResult: (rollResult) => ({
      ...rollResult,
      result: {
        hit: interpretResult(rollResult.total),
        total: rollResult.total
      }
    })
  }
)

export { rollRootRpg }

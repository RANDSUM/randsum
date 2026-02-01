import type { GameRollResult, RollRecord, RollerRollResult } from '@randsum/roller'
import { createMultiRollGameRoll } from '@randsum/roller'
import type { DaggerheartRollArgument, DaggerheartRollResult } from '../types'
import { calculateType } from './calculateType'

function digestHopeFearTotal(roll: RollRecord): {
  roll: number
  amplified: boolean
} {
  return {
    roll: roll.total,
    amplified: roll.parameters.sides === 20
  }
}

export const rollDaggerheart: (
  arg: DaggerheartRollArgument
) => GameRollResult<DaggerheartRollResult['type'], DaggerheartRollResult['details'], RollRecord> =
  createMultiRollGameRoll<
    DaggerheartRollArgument,
    DaggerheartRollResult['type'],
    DaggerheartRollResult['details']
  >({
    validate: () => undefined,
    toRollOptions: (arg: DaggerheartRollArgument) => {
      const isAdvantage = arg.rollingWith === 'Advantage'
      const hopeRollOptions = {
        sides: arg.amplifyHope ? 20 : 12,
        key: 'hope'
      }
      const fearRollOptions = {
        sides: arg.amplifyFear ? 20 : 12,
        key: 'fear'
      }
      const advDisadvantageOptions = arg.rollingWith
        ? {
            sides: 6,
            key: arg.rollingWith,
            arithmetic: isAdvantage ? ('add' as const) : ('subtract' as const)
          }
        : undefined

      return [hopeRollOptions, fearRollOptions, advDisadvantageOptions].filter(
        (a): a is NonNullable<typeof a> => a !== undefined
      )
    },
    interpretResult: (
      input: DaggerheartRollArgument,
      _rollResult: RollerRollResult,
      rollsByKey: Map<string, RollRecord>
    ) => {
      const hopeRoll = rollsByKey.get('hope')
      const fearRoll = rollsByKey.get('fear')
      const advDisadvantageRoll = input.rollingWith ? rollsByKey.get(input.rollingWith) : undefined

      if (!hopeRoll || !fearRoll) {
        throw new Error('Failed to properly roll.')
      }

      const advantage = advDisadvantageRoll
        ? {
            roll: advDisadvantageRoll.appliedTotal,
            amplified: false
          }
        : undefined

      const resultType = calculateType(hopeRoll.total, fearRoll.total)
      const details: DaggerheartRollResult['details'] = {
        hope: digestHopeFearTotal(hopeRoll),
        fear: digestHopeFearTotal(fearRoll),
        advantage,
        modifier: input.modifier ?? 0
      }

      const modifier = input.modifier ?? 0
      const baseTotal = _rollResult.total

      return {
        result: resultType,
        details,
        total: baseTotal + modifier
      }
    }
  })

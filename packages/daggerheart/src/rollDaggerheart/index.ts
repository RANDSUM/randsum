import type { RollResult } from '@randsum/roller'
import { rollWrapper } from '@randsum/roller'
import type { DaggerheartRollArgument, DaggerheartRollResult } from '../types'
import { calculateType } from './calculateType'

const rollDaggerheart: (
  arg: DaggerheartRollArgument
) => RollResult<DaggerheartRollResult> = rollWrapper({
  toArg: ({
    rollingWith,
    amplifyHope = false,
    amplifyFear = false
  }: DaggerheartRollArgument = {}) => {
    const isAdvantage = rollingWith === 'Advantage'
    const hopeRollOptions = {
      sides: amplifyHope ? 20 : 12,
      key: 'hope'
    }
    const fearRollOptions = {
      sides: amplifyFear ? 20 : 12,
      key: 'fear'
    }
    const advDisadvantageOptions = {
      sides: 6,
      key: rollingWith,
      arithmetic: isAdvantage ? ('add' as const) : ('subtract' as const)
    }

    return [
      hopeRollOptions,
      fearRollOptions,
      rollingWith ? advDisadvantageOptions : undefined
    ].filter((a) => !!a)
  },
  toResult: (rollResult, arg) => {
    const hopeRoll = rollResult.rolls.find(
      (roll) => roll.parameters.key === 'hope'
    )
    const fearRoll = rollResult.rolls.find(
      (roll) => roll.parameters.key === 'fear'
    )
    const advDisadvantageRoll = rollResult.rolls.find(
      (roll) => arg?.rollingWith && roll.parameters.key === arg.rollingWith
    )

    if (!hopeRoll || !fearRoll) {
      throw new Error('Failed to properly roll.')
    }

    return {
      ...rollResult,
      result: {
        total: rollResult.total + (arg?.modifier ?? 0),
        type: calculateType(hopeRoll.total, fearRoll.total),
        details: {
          hope: {
            roll: hopeRoll.total,
            amplified: !!arg?.amplifyHope
          },
          fear: {
            roll: fearRoll.total,
            amplified: !!arg?.amplifyFear
          },
          advantage: advDisadvantageRoll
            ? {
                roll: advDisadvantageRoll.appliedTotal
              }
            : undefined,
          modifier: arg?.modifier ?? 0
        }
      }
    }
  }
})

export { rollDaggerheart }

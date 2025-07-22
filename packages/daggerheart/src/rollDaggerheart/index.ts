import type { RollRecord, RollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'
import type { DaggerheartRollArgument, DaggerheartRollResult } from '../types'
import { calculateType } from './calculateType'

export function rollDaggerheart({
  rollingWith,
  amplifyHope = false,
  amplifyFear = false,
  modifier = 0
}: DaggerheartRollArgument): RollResult<DaggerheartRollResult> {
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

  const rollResult = roll(
    ...[
      hopeRollOptions,
      fearRollOptions,
      rollingWith ? advDisadvantageOptions : undefined
    ].filter((a) => !!a)
  )

  const hopeRoll = rollResult.rolls.find(
    (roll) => roll.parameters.key === 'hope'
  )
  const fearRoll = rollResult.rolls.find(
    (roll) => roll.parameters.key === 'fear'
  )
  const advDisadvantageRoll = rollResult.rolls.find(
    (roll) => rollingWith && roll.parameters.key === rollingWith
  )

  if (!hopeRoll || !fearRoll) {
    throw new Error('Failed to properly roll.')
  }

  const advantage = advDisadvantageRoll
    ? {
        roll: advDisadvantageRoll.appliedTotal
      }
    : undefined

  return {
    ...rollResult,
    result: {
      total: rollResult.total + modifier,
      type: calculateType(hopeRoll.total, fearRoll.total),
      details: {
        hope: digestHopeFearTotal(hopeRoll),
        fear: digestHopeFearTotal(fearRoll),
        advantage,
        modifier
      }
    }
  }
}

function digestHopeFearTotal(roll: RollRecord): {
  roll: number
  amplified: boolean
} {
  return {
    roll: roll.total,
    amplified: roll.parameters.sides === 20
  }
}

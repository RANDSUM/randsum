import { roll as coreRoll } from '@randsum/roller'
import type { DaggerheartGameResult, DaggerheartRollArgument } from '../types'
import { calculateType } from './calculateType'

export function rollDaggerheart({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: DaggerheartRollArgument = {}): DaggerheartGameResult {
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

  const args = [
    hopeRollOptions,
    fearRollOptions,
    rollingWith ? advDisadvantageOptions : undefined
  ].filter((a) => !!a)

  const result = coreRoll(...args)
  const hopeRoll = result.rolls.find((roll) => roll.parameters.key === 'hope')
  const fearRoll = result.rolls.find((roll) => roll.parameters.key === 'fear')
  const advDisadvantageRoll = result.rolls.find(
    (roll) => roll.parameters.key === rollingWith
  )

  if (!hopeRoll || !fearRoll) {
    throw new Error('Failed to properly roll.')
  }

  return {
    rolls: result.rolls,
    result: {
      total: result.total,
      type: calculateType(hopeRoll.total, fearRoll.total),
      details: {
        hope: {
          roll: hopeRoll.total,
          amplified: amplifyHope
        },
        fear: {
          roll: fearRoll.total,
          amplified: amplifyFear
        },
        advantage: advDisadvantageRoll
          ? {
              roll: advDisadvantageRoll.appliedTotal
            }
          : undefined,
        modifier
      }
    }
  }
}

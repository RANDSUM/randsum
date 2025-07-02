import type {
  CustomRollArgument,
  CustomRollResult,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult,
  SingleRollResult
} from './types'
import { calculateTotal, normalizeArgument } from './utils'
import { generateRoll } from './utils/generateRoll'

function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
function roll(...args: RollArgument[]): RollResult {
  const parameters = args.map((arg) => normalizeArgument(arg))
  const rolls = parameters.map((param) => generateRoll(param))

  return {
    parameters,
    rolls,
    rawResults: rolls.map((roll) => roll.rawRolls).flat(),
    total: calculateTotal(rolls.map((roll) => roll.total)),
    type: calculateRollType(rolls)
  } as RollResult
}

function calculateRollType(rolls: SingleRollResult[]): RollResult['type'] {
  if (rolls.every((roll) => roll.type === 'numeric')) {
    return 'numeric'
  }

  if (rolls.every((roll) => roll.type === 'custom')) {
    return 'custom'
  }

  return 'mixed'
}

export { roll }

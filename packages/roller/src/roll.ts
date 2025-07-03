import type {
  CustomRollArgument,
  CustomRollResult,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from './types'
import {
  calculateTotal,
  generateRoll,
  isRollResult,
  normalizeArgument,
  rollType
} from './lib'

function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
function roll(...args: RollArgument[]): RollResult {
  const parameters = args.map((arg) => normalizeArgument(arg))
  const rolls = parameters.map((param) => generateRoll(param))

  const result = {
    rolls,
    rawResults: rolls.map((roll) => roll.rawRolls).flat(),
    total: calculateTotal(rolls.map((roll) => roll.total)),
    type: rollType(rolls)
  }

  if (isRollResult(result)) {
    return result
  }
  throw new Error('Failed to generate roll result. Please try again.')
}

export { roll }

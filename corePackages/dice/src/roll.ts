import type {
  CustomRollArgument,
  CustomRollResult,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from './types'
import { calculateTotal, normalizeArgument } from './utils'
import { generateRoll } from './utils/generateRoll'
import { rollType } from './utils/rollType'

function roll(...args: NumericRollArgument[]): NumericRollResult
function roll(...args: CustomRollArgument[]): CustomRollResult
function roll(...args: (NumericRollArgument | CustomRollArgument)[]): RollResult
function roll(...args: RollArgument[]): RollResult {
  const parameters = args.map((arg) => normalizeArgument(arg))
  const rolls = parameters.map((param) => generateRoll(param))

  return {
    rolls,
    rawResults: rolls.map((roll) => roll.rawRolls).flat(),
    total: calculateTotal(rolls.map((roll) => roll.total)),
    type: rollType(rolls)
  } as RollResult
}

export { roll }

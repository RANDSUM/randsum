import type {
  CustomRollArgument,
  CustomRollResult,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from '../types'
import { isRollResult } from '../lib'
import { normalizeArgument } from './normalizeArgument'
import { generateRoll } from './generateRoll'

function roll(arg: NumericRollArgument): NumericRollResult
function roll(arg: CustomRollArgument): CustomRollResult
function roll(arg: RollArgument): RollResult {
  const parameter = normalizeArgument(arg)
  const result = generateRoll(parameter)

  if (isRollResult(result)) {
    return result
  }
  throw new Error('Failed to generate roll result. Please try again.')
}

export { roll }

import type {
  CustomRollArgument,
  CustomRollResult,
  NumericRollArgument,
  NumericRollResult,
  RollArgument,
  RollResult
} from '../types'
import {
  isCustomResult,
  isCustomRollArgument,
  isNumericResult,
  isNumericRollArgument
} from '../lib'
import { normalizeArgument } from './normalizeArgument'
import { generateRoll } from './generateRoll'

function roll(arg: NumericRollArgument): NumericRollResult
function roll(arg: CustomRollArgument): CustomRollResult
function roll(arg: RollArgument): RollResult
function roll(arg: RollArgument): RollResult {
  const parameter = normalizeArgument(arg)
  const result = generateRoll(parameter)

  if (isNumericRollArgument(arg)) {
    if (!isNumericResult(result)) {
      throw new Error(
        'Failed to generate Numeric roll result. Please try again.'
      )
    }
    return result
  }

  if (isCustomRollArgument(arg)) {
    if (!isCustomResult(result)) {
      throw new Error(
        'Failed to generate Custom roll result. Please try again.'
      )
    }
    return result
  }

  throw new Error('Failed to generate roll result. Please try again.')
}

export { roll }

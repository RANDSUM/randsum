import { isCustomResult, isNumericResult } from '../../lib'
import type {
  CustomRollParams,
  CustomRollResult,
  NumericRollParams,
  NumericRollResult
} from '../../types'
import { generateHistory } from './generateHistory'
import { generateInitialRolls } from './generateInitialRolls'

export function generateRollResult(
  parameters: CustomRollParams | NumericRollParams
): NumericRollResult | CustomRollResult {
  const initialRolls = generateInitialRolls(parameters)
  const history = generateHistory(parameters, initialRolls)
  const type = initialRolls.every((n) => typeof n === 'number')
    ? 'numeric'
    : 'custom'
  const rollResult = {
    parameters,
    die: parameters.die,
    description: parameters.description,
    history,
    rolls: history.modifiedRolls,
    total: history.total,
    type
  }

  if (isNumericResult(rollResult) || isCustomResult(rollResult)) {
    return rollResult
  }

  throw new Error('Failed to generate roll result. Please try again.')
}

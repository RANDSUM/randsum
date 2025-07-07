import type {
  CustomRollResult,
  NumericRollResult,
  RollParams,
  RollResult
} from '../../types'
import { isCustomRollParams } from '../../lib/guards/isCustomRollParams'
import { isNumericRollParams } from '../../lib/guards/isNumericRollParams'
import { calculateTotal } from '../utils/calculateTotal'
import { generateHistory } from './generateHistory'
import { generateInitialRolls } from './generateInitialRolls'

export function generateRoll(parameters: RollParams): RollResult {
  const initialRolls = generateInitialRolls(parameters)
  const history = generateHistory(parameters, initialRolls)
  if (
    initialRolls.every((n) => typeof n === 'number') &&
    history.initialRolls.every((n) => typeof n === 'number') &&
    isNumericRollParams(parameters)
  ) {
    return {
      parameters,
      history,
      rolls: history.modifiedRolls,
      total: history.total,
      type: 'numeric'
    } as NumericRollResult
  }
  if (
    initialRolls.every((n) => typeof n === 'string') &&
    history.initialRolls.every((n) => typeof n === 'string') &&
    isCustomRollParams(parameters)
  ) {
    return {
      parameters,
      history,
      rolls: history.initialRolls,
      total: calculateTotal(history.initialRolls),
      type: 'custom'
    } as CustomRollResult
  }
  throw new Error('Mixed rolls are not supported yet')
}

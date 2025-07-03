import type {
  CustomRollPoolResult,
  NumericRollPoolResult,
  RollParams,
  RollPoolResult
} from '../../types'
import { isCustomRollParams } from '../../lib/guards/isCustomRollParams'
import { isNumericRollParams } from '../../lib/guards/isNumericRollParams'
import { calculateTotal } from '../utils/calculateTotal'
import { generateModifiedRolls } from './generateModifiedRolls'
import { generateRawRolls } from './generateRawRolls'

export function generateRoll(parameters: RollParams): RollPoolResult {
  const rawRolls = generateRawRolls(parameters)
  const modifiedRolls = generateModifiedRolls(parameters, rawRolls)
  const rawResult = calculateTotal(rawRolls)
  if (
    rawRolls.every((n) => typeof n === 'number') &&
    modifiedRolls.rolls.every((n) => typeof n === 'number') &&
    typeof rawResult === 'number' &&
    isNumericRollParams(parameters)
  ) {
    return {
      parameters,
      rawResult,
      rawRolls,
      modifiedRolls,
      total: modifiedRolls.total,
      type: 'numeric'
    } as NumericRollPoolResult
  }
  if (
    rawRolls.every((n) => typeof n === 'string') &&
    modifiedRolls.rolls.every((n) => typeof n === 'string') &&
    typeof rawResult === 'string' &&
    isCustomRollParams(parameters)
  ) {
    return {
      parameters,
      rawResult,
      rawRolls,
      modifiedRolls,
      total: calculateTotal(modifiedRolls.rolls),
      type: 'custom'
    } as CustomRollPoolResult
  }
  throw new Error('Mixed rolls are not supported yet')
}

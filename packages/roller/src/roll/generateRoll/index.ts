import type {
  CustomRollResult,
  NumericRollResult,
  RollParams,
  RollResult
} from '../../types'
import { isCustomRollParams } from '../../lib/guards/isCustomRollParams'
import { isNumericRollParams } from '../../lib/guards/isNumericRollParams'
import { calculateTotal } from '../utils/calculateTotal'
import { generateModifiedRolls } from './generateModifiedRolls'
import { generateRawRolls } from './generateRawRolls'

export function generateRoll(parameters: RollParams): RollResult {
  const rawRolls = generateRawRolls(parameters)
  const modifiedRolls = generateModifiedRolls(parameters, rawRolls)
  if (
    rawRolls.every((n) => typeof n === 'number') &&
    modifiedRolls.rolls.every((n) => typeof n === 'number') &&
    isNumericRollParams(parameters)
  ) {
    return {
      parameters,
      modifiedRolls,
      total: modifiedRolls.total,
      type: 'numeric'
    } as NumericRollResult
  }
  if (
    rawRolls.every((n) => typeof n === 'string') &&
    modifiedRolls.rolls.every((n) => typeof n === 'string') &&
    isCustomRollParams(parameters)
  ) {
    return {
      parameters,
      modifiedRolls,
      total: calculateTotal(modifiedRolls.rolls),
      type: 'custom'
    } as CustomRollResult
  }
  throw new Error('Mixed rolls are not supported yet')
}

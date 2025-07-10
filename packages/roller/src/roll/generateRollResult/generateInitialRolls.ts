import type {
  CustomRollParams,
  NumericRollParams,
  RollHistory
} from '../../types'
import { coreSpreadRolls, isRollOptions } from '../../lib'

function generateInitialRolls(
  params: CustomRollParams
): RollHistory<CustomRollParams>['initialRolls']
function generateInitialRolls(
  params: NumericRollParams
): RollHistory<NumericRollParams>['initialRolls']
function generateInitialRolls({
  options
}: CustomRollParams | NumericRollParams):
  | RollHistory<CustomRollParams>['initialRolls']
  | RollHistory<NumericRollParams>['initialRolls']
function generateInitialRolls({
  options
}: CustomRollParams | NumericRollParams):
  | RollHistory<CustomRollParams>['initialRolls']
  | RollHistory<NumericRollParams>['initialRolls'] {
  const quantity = options.quantity ?? 1

  if (isRollOptions(options)) {
    return coreSpreadRolls<number>(quantity, options.sides)
  } else {
    return coreSpreadRolls(quantity, options.sides.length, options.sides)
  }
}

export { generateInitialRolls }

import type { NumericRollParams, RollParams } from '../types'

export function isNumericRollParams(
  poolParameters: RollParams
): poolParameters is NumericRollParams {
  return !Array.isArray(poolParameters.options.sides)
}

import type { NumericRollParams, RollParams } from '../../types'

export function isNumericRollParams(
  poolParameters: unknown
): poolParameters is NumericRollParams {
  return !Array.isArray((poolParameters as RollParams).options.sides)
}

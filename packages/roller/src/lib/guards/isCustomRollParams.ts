import type { CustomRollParams, RollParams } from '../../types'

export function isCustomRollParams(
  poolParameters: unknown
): poolParameters is CustomRollParams {
  return (
    typeof poolParameters === 'object' &&
    poolParameters !== null &&
    'options' in poolParameters &&
    typeof (poolParameters as RollParams).options === 'object' &&
    Array.isArray((poolParameters as RollParams).options.sides)
  )
}

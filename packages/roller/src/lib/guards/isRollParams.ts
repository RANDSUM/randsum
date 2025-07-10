import type { RollParams } from '../../types'

export function isRollParams(
  poolParameters: unknown
): poolParameters is RollParams {
  return (
    typeof poolParameters === 'object' &&
    poolParameters !== null &&
    'options' in poolParameters &&
    typeof (poolParameters as RollParams).options === 'object' &&
    !Array.isArray((poolParameters as RollParams).options.sides)
  )
}

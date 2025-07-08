import type { CustomRollParams, RollParams } from '../../types'

export function isCustomRollParams(
  poolParameters: unknown
): poolParameters is CustomRollParams {
  return Array.isArray((poolParameters as RollParams).options.sides)
}

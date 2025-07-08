import { roll } from './roll'
import type { NumericRollArgument, NumericRollResult } from './types'

export function meetOrBeat(
  total: number,
  rollArg: NumericRollArgument = { sides: 20 }
): [boolean, NumericRollResult] {
  const result = roll(rollArg)
  return [result.total >= total, result]
}

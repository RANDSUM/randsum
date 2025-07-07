import { roll } from './roll'
import type { NumericRollArgument } from './types'

export function meetOrBeat(
  total: number,
  rollArg: NumericRollArgument = { sides: 20 }
): boolean {
  return roll(rollArg).total >= total
}

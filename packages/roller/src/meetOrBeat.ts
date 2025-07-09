import { roll } from './roll'
import type { MeetOrBeatResult, NumericRollArgument } from './types'

export function meetOrBeat(
  target: number,
  rollArg: NumericRollArgument = { sides: 20 }
): MeetOrBeatResult {
  const result = roll(rollArg)
  return {
    success: result.total >= target,
    target,
    result
  }
}

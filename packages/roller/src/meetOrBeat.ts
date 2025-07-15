import { roll } from './roll'
import type { MeetOrBeatResult, RollArgument } from './types'

export function meetOrBeat(
  target: number,
  rollArg: RollArgument = { sides: 20 }
): MeetOrBeatResult {
  const result = roll(rollArg)
  return {
    success: result.total >= target,
    target,
    result
  }
}

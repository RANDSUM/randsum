import { rollDH } from './rollDH'
import type { MeetOrBeatResultDH, RollArgumentDH } from './types'

export function meetOrBeatDH(
  difficultyClass: number,
  rollArg: RollArgumentDH
): MeetOrBeatResultDH {
  const result = rollDH(rollArg)
  return {
    ...result,
    success: result.total >= difficultyClass,
    target: difficultyClass
  }
}

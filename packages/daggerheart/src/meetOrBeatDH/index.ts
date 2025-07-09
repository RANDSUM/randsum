import { rollHopeFear } from '../rollHopeFear'
import type { DHMeetOrBeatResult, DHRollArgument } from '../types'
import { formatDescription } from './formatDescription'

export function meetOrBeat(
  difficultyClass: number,
  rollArg: DHRollArgument
): DHMeetOrBeatResult {
  const result = rollHopeFear(rollArg)
  const core = {
    ...result,
    success:
      result.type === 'critical hope' ? true : result.total >= difficultyClass,
    target: difficultyClass
  }

  return {
    ...core,
    description: formatDescription(core)
  }
}

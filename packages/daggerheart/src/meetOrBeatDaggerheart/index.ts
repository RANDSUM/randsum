import { rollDaggerheart } from '../rollDaggerheart'
import type {
  DaggerheartMeetOrBeatResult,
  DaggerheartRollArgument
} from '../types'
import { formatDescription } from './formatDescription'

export function meetOrBeatDaggerheart(
  difficultyClass: number,
  rollArg: DaggerheartRollArgument = {}
): DaggerheartMeetOrBeatResult {
  const result = rollDaggerheart(rollArg)
  const core: Omit<DaggerheartMeetOrBeatResult, 'description'> = {
    result: result.details,
    success:
      result.details.type === 'critical hope'
        ? true
        : result.details.total >= difficultyClass,
    target: difficultyClass
  }

  return {
    ...core,
    description: formatDescription(core)
  }
}

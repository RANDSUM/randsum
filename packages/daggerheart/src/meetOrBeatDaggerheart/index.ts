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

import { roll } from './roll'
import type { MeetOrBeatResultDH, RollArgumentDH } from './types'

export function meetOrBeat(
  difficultyClass: number,
  rollArg: RollArgumentDH
): MeetOrBeatResultDH {
  const result = roll(rollArg)
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

function formatDescription({
  type,
  success
}: Omit<MeetOrBeatResultDH, 'description'>): string {
  if (type === 'critical hope') {
    return 'Critical Success (With Hope)'
  }
  if (success) {
    return `Success with ${type}`
  }
  return `Failure with ${type}`
}

import type { RollResult } from './roll'

export interface MeetOrBeatResult {
  success: boolean
  target: number
  result: RollResult
}

import type { DaggerheartMeetOrBeatResult } from '../types'

export function formatDescription({
  type,
  success
}: Omit<DaggerheartMeetOrBeatResult, 'description'>): string {
  if (type === 'critical hope') {
    return 'Critical Success (With Hope)'
  }
  if (success) {
    return `Success with ${type}`
  }
  return `Failure with ${type}`
}

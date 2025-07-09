import type { DHMeetOrBeatResult } from '../types'

export function formatDescription({
  type,
  success
}: Omit<DHMeetOrBeatResult, 'description'>): string {
  if (type === 'critical hope') {
    return 'Critical Success (With Hope)'
  }
  if (success) {
    return `Success with ${type}`
  }
  return `Failure with ${type}`
}

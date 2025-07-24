import type { ModifierLog } from '../../../types'

export function mergeLogs(existingLogs: ModifierLog[], newLog: ModifierLog): ModifierLog[] {
  return [...existingLogs, newLog]
}

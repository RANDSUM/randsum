import type { DaggerheartRollResultType } from '../types'

export function calculateType(hope: number, fear: number): DaggerheartRollResultType {
  if (hope === fear) {
    return 'critical hope'
  }
  if (hope > fear) {
    return 'hope'
  }
  return 'fear'
}

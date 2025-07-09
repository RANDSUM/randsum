import type { DHRollResultType } from '../types'

export function calculateType(hope: number, fear: number): DHRollResultType {
  if (hope === fear) {
    return 'critical hope'
  }
  if (hope > fear) {
    return 'hope'
  }
  return 'fear'
}

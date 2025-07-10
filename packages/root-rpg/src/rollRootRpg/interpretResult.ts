import type { RootRpgResult } from '../types'

export function interpretResult(result: number): RootRpgResult {
  switch (true) {
    case result >= 10:
      return 'Strong Hit'
    case result >= 7 && result <= 9:
      return 'Weak Hit'
    default:
      return 'Miss'
  }
}

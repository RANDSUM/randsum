import type { SalvageUnionHit } from '../types'

export function interpretHit(result: number): SalvageUnionHit {
  switch (true) {
    case result === 20:
      return 'Nailed It'
    case result >= 11 && result <= 19:
      return 'Success'
    case result >= 6 && result <= 10:
      return 'Tough Choice'
    case result >= 2 && result <= 5:
      return 'Failure'
    default:
      return 'Cascade Failure'
  }
}

import type { RollRecord } from '@randsum/roller'

export interface RollResult {
  readonly total: number
  readonly records: readonly RollRecord[]
  readonly notation: string
}

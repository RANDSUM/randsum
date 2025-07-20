import type { RollResult } from '@randsum/roller'

export type RootRpgResult = 'Strong Hit' | 'Weak Hit' | 'Miss'

export type RootRpgRollResult = RollResult<{
  hit: RootRpgResult
  total: number
}>

import type { RollRecord, RollResult } from '@randsum/roller'

export type BladesResult = 'critical' | 'success' | 'partial' | 'failure'

export type BladesRollResult = RollResult<BladesResult, RollRecord<number>>

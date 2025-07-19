import type { RollResult } from '@randsum/roller'

export type DaggerheartAdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface DaggerheartRollArgument {
  modifier?: number
  rollingWith?: DaggerheartAdvantageDisadvantage
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type DaggerheartRollResultType = 'hope' | 'fear' | 'critical hope'

export interface DaggerheartRollRecord {
  roll: number
  amplified?: boolean
}

export interface DaggerheartRollResult {
  total: number
  type: DaggerheartRollResultType
  details: {
    hope: DaggerheartRollRecord
    fear: DaggerheartRollRecord
    modifier: number
    advantage: DaggerheartRollRecord | undefined
  }
}

export type DaggerheartGameResult = RollResult<DaggerheartRollResult>

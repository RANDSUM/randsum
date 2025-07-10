export type DaggerheartAdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface DaggerheartRollArgument {
  modifier?: number
  rollingWith?: DaggerheartAdvantageDisadvantage
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type DaggerheartRollResultType = 'hope' | 'fear' | 'critical hope'

export interface DaggerheartRollResult {
  type: DaggerheartRollResultType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
  }
}

export interface DaggerheartMeetOrBeatResult extends DaggerheartRollResult {
  success: boolean
  target: number
  description: string
}

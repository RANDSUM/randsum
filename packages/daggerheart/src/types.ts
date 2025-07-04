export type AdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface RollArgument {
  modifier?: number
  rollingWith?: AdvantageDisadvantage
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type RollResultType = 'hope' | 'fear' | 'critical hope'

export interface RollResult {
  type: RollResultType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
  }
}

export interface MeetOrBeatResult extends RollResult {
  success: boolean
  target: number
  description: string
}

export type AdvantageDisadvantageDH = 'Advantage' | 'Disadvantage'
export interface RollArgumentDH {
  modifier?: number
  rollingWith?: AdvantageDisadvantageDH
  amplifyHope?: boolean
  amplifyFear?: boolean
}

export type RollResultDHType = 'hope' | 'fear' | 'critical hope'

export interface RollResultDH {
  type: RollResultDHType
  total: number
  rolls: {
    hope: number
    fear: number
    modifier: number
    advantage: number | undefined
  }
}

export interface MeetOrBeatResultDH extends RollResultDH {
  success: boolean
  target: number
  description: string
}

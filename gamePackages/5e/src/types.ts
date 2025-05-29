export type AdvantageDisadvantage5e = 'Advantage' | 'Disadvantage'
export interface RollArgument5e {
  modifier: number
  rollingWith?: AdvantageDisadvantage5e
}

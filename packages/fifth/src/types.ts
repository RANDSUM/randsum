export type AdvantageDisadvantage = 'Advantage' | 'Disadvantage'
export interface RollArgument {
  modifier: number
  rollingWith?: AdvantageDisadvantage
}

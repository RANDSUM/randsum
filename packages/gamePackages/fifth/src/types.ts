export interface FifthAdvantageDisadvantage {
  advantage?: boolean
  disadvantage?: boolean
}

export interface FifthRollArgument {
  modifier: number
  rollingWith?: FifthAdvantageDisadvantage
}

/**
 * The result type for a 5E action roll.
 * For 5E, the result is simply the total (d20 + modifier).
 */
export type FifthRollResult = number

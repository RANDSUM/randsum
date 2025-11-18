export type RollArithmetic = 'add' | 'subtract'

export interface CapModifierOptions {
  greaterThan?: number
  lessThan?: number
}

export interface DropModifierOptions {
  highest?: number
  lowest?: number
  exact?: number[]
  greaterThan?: number
  lessThan?: number
}

export interface RerollModifierOptions {
  exact?: number[]
  greaterThan?: number
  lessThan?: number
  max?: number
}

export type UniqueModifierOptions = true | { notUnique: number[] }

export interface ReplaceComparison {
  greaterThan?: number
  lessThan?: number
}

export interface ReplaceRule {
  from: number | ReplaceComparison
  to: number
}

export type ReplaceModifierOptions = ReplaceRule | ReplaceRule[]

export interface Modifiers {
  plus?: number
  minus?: number
  drop?: DropModifierOptions
  cap?: CapModifierOptions
  reroll?: RerollModifierOptions
  unique?: UniqueModifierOptions
  explode?: boolean
  replace?: ReplaceModifierOptions
}

export interface RollOptions {
  sides: number | string[]
  quantity?: number
  modifiers?: Modifiers
  arithmetic?: RollArithmetic
}

export interface RollParams extends RequiredNumericRollParameters {
  /**
   * Original argument that produced this parameter (number, string, or RollOptions)
   */
  argument: unknown
  /**
   * Canonical dice notation string for this parameter, e.g. `4d6L+2`
   */
  notation: string
  /**
   * Human readable description of the roll and its modifiers
   */
  description: string[]
  /**
   * A stable key used by consumers (the tests expect `Roll 1`, `Roll 2`, etc.)
   */
  key: string
  /**
   * For custom-face dice, this is the list of faces used to translate numeric rolls.
   */
  faces?: string[]
}

export interface RequiredNumericRollParameters {
  sides: number
  quantity: number
  modifiers?: Modifiers
}

export interface ModifierLog {
  modifier: 'plus' | 'minus' | 'cap' | 'drop' | 'reroll' | 'explode' | 'unique' | 'replace'
  options: unknown
  removed: number[]
  added: number[]
}

export interface NumericRollBonus {
  rolls: number[]
  simpleMathModifier: number
  logs: ModifierLog[]
}

export interface ModifierHistory {
  initialRolls: number[]
  modifiedRolls: number[]
  total: number
  logs: ModifierLog[]
}

export interface RollRecord {
  parameters: RollParams
  modifierHistory: ModifierHistory
  total: number
}



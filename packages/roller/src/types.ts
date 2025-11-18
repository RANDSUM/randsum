export type Arithmetic = 'add' | 'subtract'

export type ComparisonCondition =
  | { greaterThan: number }
  | { lessThan: number }
  | { greaterThan: number; lessThan: number }

export type ReplaceFrom = number | ComparisonCondition

export interface ReplaceRule {
  from: ReplaceFrom
  to: number
}

export interface DropModifier {
  lowest?: number
  highest?: number
  exact?: number[]
  greaterThan?: number
  lessThan?: number
}

export interface CapModifier {
  greaterThan?: number
  lessThan?: number
}

export interface RerollModifier {
  exact?: number[]
  greaterThan?: number
  lessThan?: number
  max?: number
}

export type UniqueModifier = boolean | { notUnique: number[] }

export type ReplaceModifier = ReplaceRule | ReplaceRule[]

export interface Modifiers {
  plus?: number
  minus?: number
  drop?: DropModifier
  cap?: CapModifier
  reroll?: RerollModifier
  explode?: boolean
  unique?: UniqueModifier
  replace?: ReplaceModifier
}

export interface RollOptions {
  sides: number | string[]
  quantity?: number
  modifiers?: Modifiers
  arithmetic?: Arithmetic
  faces?: string[]
}

export interface RollParams extends RollOptions {
  argument: RollArgument
  notation: string
  description: string[]
  key: string
}

export type RollArgument = number | string | RollOptions

export interface ModifierLog {
  modifier: keyof Modifiers
  options: unknown
  removed: number[]
  added: number[]
}

export interface NumericRollBonus {
  rolls: number[]
  simpleMathModifier: number
  logs: ModifierLog[]
  modifiedRolls?: number[]
  initialRolls?: number[]
  total?: number
}

export interface RequiredNumericRollParameters {
  sides: number
  quantity: number
}

export interface RollRecord {
  parameters: RollParams
  total: number
  modifierHistory: NumericRollBonus
  result?: (number | string)[]
}

export interface RollerRollResult {
  total: number
  rolls: RollRecord[]
  result?: (number | string)[]
}

export interface ValidationResult {
  valid: boolean
  options?: RollOptions[]
  notation?: string[]
  description?: string[][]
}


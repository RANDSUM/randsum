// Core type definitions for the roller package

export type Arithmetic = 'add' | 'subtract'

export interface ComparisonQuery {
  lessThan?: number
  greaterThan?: number
  exact?: number[]
}

export interface DropModifier extends ComparisonQuery {
  lowest?: number
  highest?: number
}

export interface RerollModifier extends ComparisonQuery {
  max?: number
}

export interface CapModifier {
  lessThan?: number
  greaterThan?: number
}

export interface ReplaceModifier {
  from: number | ComparisonQuery
  to: number
}

export type UniqueModifier = boolean | { notUnique: number[] }

export interface RollModifiers {
  plus?: number
  minus?: number
  drop?: DropModifier
  reroll?: RerollModifier
  cap?: CapModifier
  replace?: ReplaceModifier | ReplaceModifier[]
  unique?: UniqueModifier
  explode?: boolean
}

export interface RequiredNumericRollParameters {
  sides: number
  quantity: number
}

export interface RollOptions extends RequiredNumericRollParameters {
  modifiers?: RollModifiers
  arithmetic?: Arithmetic
  sides: number | string[]
  quantity?: number
  faces?: string[]
}

export interface RollParams extends RequiredNumericRollParameters {
  sides: number
  quantity: number
  modifiers: RollModifiers
  notation: string
  description: string[]
  key: string
  argument: string | number | RollOptions
  arithmetic: Arithmetic
  faces?: string[]
}

export interface ModifierLog {
  modifier: string
  options: unknown
  added: number[]
  removed: number[]
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
  total: number
  modifierHistory: ModifierHistory
}

export interface RollResult {
  total: number
  result: (number | string)[]
  rolls: RollRecord[]
  notation: string
  description: string[]
}


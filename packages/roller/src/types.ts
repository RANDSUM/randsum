export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface ComparisonOptions {
  greaterThan?: number
  lessThan?: number
}

export interface DropOptions extends ComparisonOptions {
  highest?: number
  lowest?: number
  exact?: number[]
}

export interface RerollOptions extends ComparisonOptions {
  exact?: number[]
  max?: number
}

export interface ReplaceOptions {
  from: number | ComparisonOptions
  to: number
}

export interface UniqueOptions {
  notUnique: number[]
}

export type ModifierConfig =
  | number
  | boolean
  | ComparisonOptions
  | DropOptions
  | ReplaceOptions
  | ReplaceOptions[]
  | RerollOptions
  | UniqueOptions

export interface ModifierOptions {
  cap?: ComparisonOptions
  drop?: DropOptions
  replace?: ReplaceOptions | ReplaceOptions[]
  reroll?: RerollOptions
  unique?: boolean | UniqueOptions
  explode?: boolean
  plus?: number
  minus?: number
}

export interface ModifierLog {
  modifier: string
  options: ModifierConfig | undefined
  added: number[]
  removed: number[]
}

export interface RollBonus {
  rolls: number[]
  simpleMathModifier: number
  logs: ModifierLog[]
}

export interface RollOptions {
  quantity?: number
  sides: number
  modifiers?: ModifierOptions
}

export type RequiredRollParameters = Required<Omit<RollOptions, 'modifiers'>>

export type RollArgument = RollOptions | DiceNotation | number | `${number}`

export interface RollParams {
  options: RollOptions
  notation: DiceNotation
  argument: RollArgument
  description: string[]
}

export interface RollHistory {
  modifiedRolls: number[]
  total: number
  initialRolls: number[]
  logs: ModifierLog[]
}

export interface RollResult {
  parameters: RollParams
  description: RollParams['description']
  rolls: RollHistory['modifiedRolls']
  history: RollHistory
  total: number
}

export interface MeetOrBeatResult {
  success: boolean
  target: number
  result: RollResult
}

export interface ValidValidationResult {
  valid: true
  digested: RollOptions
  description: string[]
  notation: DiceNotation
}
export interface InvalidValidationResult {
  valid: false
  description: string[]
  digested: Record<string, never>
  notation: string
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult

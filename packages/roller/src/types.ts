// ============================================================================
// Core Types
// ============================================================================

export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`

export interface RollOptions<T = string> {
  quantity?: number
  arithmetic?: 'add' | 'subtract'
  sides: number | T[]
  modifiers?: ModifierOptions
}

export type RequiredNumericRollParameters = Pick<RollOptions, 'quantity' | 'sides'> & {
  quantity: number
  sides: number
}

export type RollArgument<T = string> = RollOptions<T> | DiceNotation | number | `${number}`

export interface ComparisonOptions {
  greaterThan?: number
  lessThan?: number
}

export interface ExactComparisonOptions extends ComparisonOptions {
  exact?: number[]
}

export interface DropOptions extends ExactComparisonOptions {
  highest?: number
  lowest?: number
}

export interface RerollOptions extends ExactComparisonOptions {
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

export interface NumericRollBonus {
  rolls: number[]
  simpleMathModifier: number
  logs: ModifierLog[]
}

export interface RollParams<T = string> extends Required<Omit<RollOptions<T>, 'sides'>> {
  sides: number
  faces?: T[]
  key?: string
  argument: RollArgument<T>
  description: string[]
  notation: DiceNotation
}

export interface RollRecord<T = string> {
  description: RollParams<T>['description']
  parameters: RollParams<T>
  rolls: number[]
  modifierHistory: {
    logs: NumericRollBonus['logs']
    modifiedRolls: number[]
    total: number
    initialRolls: number[]
  }
  appliedTotal: number
  customResults?: T[]
  total: number
}

export interface RollResult<TResult = number, TRollRecord = RollRecord> {
  rolls: TRollRecord[]
  result: TResult
}

export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  total: number
}

export interface ValidValidationResult {
  valid: true
  argument: DiceNotation
  description: string[][]
  options: RollOptions[]
  notation: DiceNotation[]
}

export interface InvalidValidationResult {
  valid: false
  argument: string
}

export type ValidationResult = ValidValidationResult | InvalidValidationResult

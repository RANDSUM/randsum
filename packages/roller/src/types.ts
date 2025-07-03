export interface NumericDie {
  readonly type: 'numeric'
  readonly sides: number
  readonly faces: number[]
  readonly isCustom: false
  roll(quantity?: number): number
  rollSpread(quantity?: number): number[]
  rollModified(quantity: number, modifiers?: ModifierOptions): NumericRollResult
  toOptions: NumericRollOptions
}

export interface CustomDie {
  readonly type: 'custom'
  readonly sides: number
  readonly faces: string[]
  readonly isCustom: true
  roll(quantity?: number): string
  rollSpread(quantity?: number): string[]
  rollModified(quantity: number, modifiers?: ModifierOptions): CustomRollResult
  toOptions: CustomRollOptions
}

export type BaseD = NumericDie | CustomDie

export type NumericRollArgument =
  | NumericDie
  | NumericRollOptions
  | NumericDiceNotation
  | number
  | `${number}`

export type CustomRollArgument =
  | CustomDie
  | CustomRollOptions
  | CustomDiceNotation
  | string[]

export type RollArgument = NumericRollArgument | CustomRollArgument

interface BaseRollParams<A extends RollArgument = RollArgument> {
  description: string[]
  argument: A
}

export interface NumericRollParams extends BaseRollParams<NumericRollArgument> {
  options: NumericRollOptions
  die: NumericDie
  notation: NumericDiceNotation
}

export interface CustomRollParams extends BaseRollParams<CustomRollArgument> {
  options: CustomRollOptions
  die: CustomDie
  notation: CustomDiceNotation
}

export type RollParams = NumericRollParams | CustomRollParams

interface ModifiedRolls<T extends RollParams = RollParams> {
  rolls: T['options'] extends CustomRollOptions ? string[] : number[]
  total: T['options'] extends CustomRollOptions ? string : number
  logs: ModifierLog[]
}

export interface BaseRollPoolResult<P extends RollParams = RollParams> {
  parameters: P
  rawResult: number | string
  type: 'numeric' | 'custom'
  rawRolls: number[] | string[]
  modifiedRolls: ModifiedRolls<P>
  total: string | number
}

export interface NumericRollPoolResult
  extends BaseRollPoolResult<NumericRollParams> {
  type: 'numeric'
  rawResult: number
  rawRolls: number[]
  modifiedRolls: ModifiedRolls<NumericRollParams>
  total: number
}

export interface CustomRollPoolResult
  extends BaseRollPoolResult<CustomRollParams> {
  type: 'custom'
  rawResult: string
  rawRolls: string[]
  modifiedRolls: ModifiedRolls<CustomRollParams>
  total: string
}

interface BaseRollResult {
  rolls: (NumericRollPoolResult | CustomRollPoolResult)[]
  rawResults: (string | number)[]
  total: string | number
  type: 'numeric' | 'custom' | 'mixed'
}

export interface NumericRollResult extends BaseRollResult {
  type: 'numeric'
  rolls: NumericRollPoolResult[]
  rawResults: number[]
  total: number
}

export interface CustomRollResult extends BaseRollResult {
  type: 'custom'
  rolls: CustomRollPoolResult[]
  rawResults: string[]
  total: string
}

export interface MixedRollResult extends BaseRollResult {
  type: 'mixed'
  rolls: (NumericRollPoolResult | CustomRollPoolResult)[]
  rawResults: (string | number)[]
  total: string
}

export type RollPoolResult = NumericRollPoolResult | CustomRollPoolResult

export type RollResult = NumericRollResult | CustomRollResult | MixedRollResult

export type NumericDiceNotation = `${number}${'d' | 'D'}${number}${string}`

export type CustomDiceNotation = `${number}${'d' | 'D'}{${string}}`

export type DiceNotation = NumericDiceNotation | CustomDiceNotation

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

export interface NumericRollBonus {
  rolls: number[]
  simpleMathModifier: number
  logs: ModifierLog[]
}

export interface BaseRollOptions {
  quantity?: number
}

export interface NumericRollOptions extends BaseRollOptions {
  sides: number
  modifiers?: ModifierOptions
}

export interface CustomRollOptions extends BaseRollOptions {
  quantity?: number
  sides: string[]
  modifiers?: Record<string, never>
}

export type RollOptions = NumericRollOptions | CustomRollOptions

export type RequiredNumericRollParameters = Required<
  Omit<NumericRollOptions, 'modifiers'>
>

interface BaseValidationResult {
  valid: boolean
  type: 'numeric' | 'custom' | 'invalid'
  description: string[]
}

export interface NumericValidationResult extends BaseValidationResult {
  valid: true
  type: 'numeric'
  digested: NumericRollOptions
  notation: NumericDiceNotation
}

export interface CustomValidationResult extends BaseValidationResult {
  valid: true
  type: 'custom'
  digested: CustomRollOptions
  notation: CustomDiceNotation
}

export interface InvalidValidationResult extends BaseValidationResult {
  valid: false
  type: 'invalid'
  digested: Record<string, never>
}

export type ValidationResult =
  | NumericValidationResult
  | CustomValidationResult
  | InvalidValidationResult

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

export interface NumericDieInterface {
  readonly type: 'numeric'
  readonly sides: number
  readonly faces: number[]
  readonly isCustom: false
  roll(quantity?: number): number
  rollSpread(quantity?: number): number[]
  rollModified(quantity: number, modifiers?: ModifierOptions): NumericRollResult
  toOptions: NumericRollOptions
}

export interface CustomDieInterface {
  readonly type: 'custom'
  readonly sides: number
  readonly faces: string[]
  readonly isCustom: true
  roll(quantity?: number): string
  rollSpread(quantity?: number): string[]
  rollModified(quantity: number, modifiers?: ModifierOptions): CustomRollResult
  toOptions: CustomRollOptions
}

export type BaseD = NumericDieInterface | CustomDieInterface

export type NumericRollArgument =
  | NumericDieInterface
  | NumericRollOptions
  | NumericDiceNotation
  | number
  | `${number}`

export type CustomRollArgument =
  | CustomDieInterface
  | CustomRollOptions
  | CustomDiceNotation
  | string[]

export type RollArgument = NumericRollArgument | CustomRollArgument

export interface RollHistory<P extends RollParams = RollParams> {
  modifiedRolls: P['options'] extends CustomRollOptions ? string[] : number[]
  total: P['options'] extends CustomRollOptions ? string : number
  initialRolls: P['options'] extends CustomRollOptions ? string[] : number[]
  logs: ModifierLog[]
}

export interface BaseRollResult<P extends RollParams = RollParams> {
  parameters: P
  description: P['description']
  die: P['die']
  type: 'numeric' | 'custom'
  rolls: RollHistory<P>['modifiedRolls']
  history: RollHistory<P>
  total: string | number
}

export interface NumericRollResult extends BaseRollResult<NumericRollParams> {
  type: 'numeric'
  rolls: number[]
  history: RollHistory<NumericRollParams>
  total: number
}

export interface CustomRollResult extends BaseRollResult<CustomRollParams> {
  type: 'custom'
  rolls: string[]
  history: RollHistory<CustomRollParams>
  total: string
}

export type RollResult = NumericRollResult | CustomRollResult

export interface MeetOrBeatResult {
  success: boolean
  target: number
  result: NumericRollResult
}

interface BaseRollParams<A extends RollArgument = RollArgument> {
  description: string[]
  argument: A
}

export interface NumericRollParams extends BaseRollParams<NumericRollArgument> {
  options: NumericRollOptions
  die: NumericDieInterface
  notation: NumericDiceNotation
}

export interface CustomRollParams extends BaseRollParams<CustomRollArgument> {
  options: CustomRollOptions
  die: CustomDieInterface
  notation: CustomDiceNotation
}

export type RollParams = NumericRollParams | CustomRollParams

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

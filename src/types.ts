// Primitives

type NumericDiceNotation = `${number}${'d' | 'D'}${number}${string}`
type CustomDiceNotation = `${number}${'d' | 'D'}{${string}}`
export type Notation<S extends string | number = string | number> =
  S extends number ? NumericDiceNotation : CustomDiceNotation

export type DicePoolType = 'numerical' | 'custom' | 'mixed'

// Die

export type Type<T> = T extends string[] ? 'custom' : 'numerical'
export type Faces<T> = T extends string[] ? T : number[]
export type Result<F> = F extends number[] ? number : string

export interface Die<Sides extends number | string[]> {
  sides: number
  faces: Faces<Sides>
  type: Type<Sides>
  roll: (quantity?: number) => Result<Faces<Sides>>
  rollSpread: (quantity?: number) => Result<Faces<Sides>>[]
  toOptions: RollOptions<Result<Faces<Sides>>>
  isCustom: boolean
}

// Options

export interface RollOptions<S extends string | number = string | number> {
  quantity?: number
  sides: S extends number ? number : string[]
  modifiers?: S extends number ? Modifiers : Record<string, never>
}

export type Modifiers = {
  cap?: GreaterLessOptions
  drop?: DropOptions
  replace?: ReplaceOptions | ReplaceOptions[]
  reroll?: RerollOptions
  unique?: boolean | UniqueOptions
  explode?: boolean
  plus?: number
  minus?: number
}

export interface GreaterLessOptions {
  greaterThan?: number
  lessThan?: number
}
export interface DropOptions extends GreaterLessOptions {
  highest?: number
  lowest?: number
  exact?: number[]
}

export interface RerollOptions extends GreaterLessOptions {
  exact?: number[]
  max?: number
}

export interface ReplaceOptions {
  from: number | GreaterLessOptions
  to: number
}

export interface UniqueOptions {
  notUnique: number[]
}

type CoreRollOptions<S extends string | number = string | number> = Omit<
  RollOptions<S>,
  'modifiers'
>

export type RequiredCoreDiceParameters<
  S extends string | number = string | number
> = {
  [Property in keyof CoreRollOptions<S>]-?: CoreRollOptions<S>[Property]
}

// Arguments

export type NumericalArgument =
  | `${number}`
  | number
  | Die<number>
  | RollOptions<number>
  | Notation<number>

export type CustomArgument =
  | Die<string[]>
  | RollOptions<string>
  | Notation<string>
  | string[]

export type RollArgument<S extends string | number = string | number> =
  S extends string ? CustomArgument : NumericalArgument

// Parameters

export interface RollParameters<S extends string | number = string | number> {
  argument: RollArgument<S>
  options: RollOptions<S>
  die: S extends string ? Die<string[]> : Die<number>
  notation: Notation<S>
  description: string[]
}

export interface DicePools<S extends string | number = string | number> {
  dicePools: {
    [key: string]: RollParameters<S>
  }
}

// Results

export interface RollResult<
  S extends string | number = string | number,
  DP extends DicePoolType = DicePoolType,
  Total extends S = S
> extends DicePools<S> {
  rawRolls: {
    [key: string]: S[]
  }
  modifiedRolls: {
    [key: string]: {
      rolls: S[]
      total: S
    }
  }
  result: S[]
  rawResult: S[]
  type: DP
  total: Total
}

export type RollBonuses<S extends string | number> = {
  rolls: S[]
  simpleMathModifier: number
}

export type NumericalRollResult = RollResult<number, 'numerical'>
export type CustomRollResult = RollResult<string, 'custom'>
export type MixedRollResult = RollResult<string | number, 'mixed', string>

export interface NotationValidationResult {
  valid: boolean
  type?: 'custom' | 'numerical'
  digested?: RollOptions
  notation?: Notation
  description: string[]
}

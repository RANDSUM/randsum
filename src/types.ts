export type StandardDie = 'standard'
export type CustomSidesDie = 'customSides'
export type DieType = StandardDie | CustomSidesDie

type DiceNotationWithNumericSides = `${number}${'d' | 'D'}${number}${string}`
type CustomDiceSidesNotation = `{${string}}`
type DiceNotationWithCustomSides = `${number}${
  | 'd'
  | 'D'}${CustomDiceSidesNotation}`

export type DiceNotation<N extends DieType = DieType> = N extends StandardDie
  ? DiceNotationWithNumericSides
  : DiceNotationWithCustomSides

export const coreNotationPattern = /(?<coreNotationMatch>^\d+[Dd](\d+|{.*}))/

export function isDiceNotation(argument: unknown): argument is DiceNotation {
  return !!coreNotationPattern.test(String(argument))
}

export type NumberStringArgument = number | 'inclusive'

export type NumberString<T extends NumberStringArgument = 'inclusive'> =
  T extends 'inclusive' ? number | `${number}` : number

type CustomSides = Array<number | string>

export interface DropOptions<T extends NumberStringArgument = 'inclusive'> {
  highest?: NumberString<T>
  lowest?: NumberString<T>
  greaterThan?: NumberString<T>
  lessThan?: NumberString<T>
  exact?: Array<NumberString<T>>
}

export interface GreaterLessOptions<
  T extends NumberStringArgument = 'inclusive'
> {
  greaterThan?: NumberString<T>
  lessThan?: NumberString<T>
}

type TypeOrArrayOfType<T> = T | T[]
export interface RerollOptions<T extends NumberStringArgument = 'inclusive'>
  extends GreaterLessOptions<T> {
  exact?: TypeOrArrayOfType<NumberString<T>>
  maxReroll?: NumberString<T>
}
export interface ReplaceOptions<T extends NumberStringArgument = 'inclusive'> {
  from: NumberString<T> | GreaterLessOptions<T>
  to: NumberString<T>
}
export interface StandardRandsumOptions<
  T extends NumberStringArgument = 'inclusive'
> {
  quantity?: NumberString<T>
  sides: NumberString<T>
  modifiers?: Array<Modifier<T>>
}

export type InternalRollParameters = StandardRandsumOptions<number> & {
  modifiers: Array<Modifier<number>>
  quantity: number
  faces?: CustomSides
}

export type RollParameters = InternalRollParameters & {
  initialRolls: number[]
  rollOne: () => number
}

type BaseRollResult = {
  rollParameters: RollParameters
  arguments: [RandsumOptions | DiceNotation | NumberString | undefined]
}

type StandardRollResult = BaseRollResult & {
  total: number
  rolls: number[]
}

type CustomSidesRollResult = BaseRollResult & {
  total: string
  rolls: CustomSides
}

export type RollResult<N extends DieType = DieType> = N extends StandardDie
  ? StandardRollResult
  : CustomSidesRollResult

export type CustomSidesRandsumOptions = Omit<
  StandardRandsumOptions,
  'sides' | 'modifiers'
> & {
  sides: CustomSides
}
export type RandsumOptions<N extends DieType = DieType> = N extends StandardDie
  ? StandardRandsumOptions
  : CustomSidesRandsumOptions

export function isRandsumOptions(
  argument: unknown
): argument is RandsumOptions<DieType> {
  return (
    typeof argument === 'object' &&
    (argument as RandsumOptions<DieType>).sides !== undefined
  )
}

function isModifierType<T extends Modifier<NumberStringArgument>>(
  argument: Modifier<NumberStringArgument>,
  key: keyof T
): argument is T {
  return (argument as T)[key] !== undefined
}

export type CapModifier<T extends NumberStringArgument = 'inclusive'> = Record<
  'cap',
  GreaterLessOptions<T>
>
export const isCapModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is CapModifier<NumberStringArgument> =>
  isModifierType<CapModifier<NumberStringArgument>>(modifier, 'cap')

export interface DropModifier<T extends NumberStringArgument = 'inclusive'>
  extends Record<'drop', DropOptions<T>> {
  drop: DropOptions<T>
}
export const isDropModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is DropModifier<NumberStringArgument> =>
  isModifierType<DropModifier<NumberStringArgument>>(modifier, 'drop')

export type RerollModifier<T extends NumberStringArgument = 'inclusive'> =
  Record<'reroll', TypeOrArrayOfType<RerollOptions<T>>>
export const isRerollModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is RerollModifier<NumberStringArgument> =>
  isModifierType<RerollModifier<NumberStringArgument>>(modifier, 'reroll')

export type ReplaceModifier<T extends NumberStringArgument = 'inclusive'> =
  Record<'replace', TypeOrArrayOfType<ReplaceOptions<T>>>
export const isReplaceModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is ReplaceModifier<NumberStringArgument> =>
  isModifierType<ReplaceModifier<NumberStringArgument>>(modifier, 'replace')

export type UniqueOptions<T extends NumberStringArgument = 'inclusive'> =
  Record<'notUnique', Array<NumberString<T>>>
export const isUniqueModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is UniqueModifier<NumberStringArgument> =>
  isModifierType<UniqueModifier<NumberStringArgument>>(modifier, 'unique')

export type UniqueModifier<T extends NumberStringArgument = 'inclusive'> =
  Record<'unique', boolean | UniqueOptions<T>>

export type ExplodeModifier = Record<'explode', boolean>
export const isExplodeModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is ExplodeModifier =>
  isModifierType<ExplodeModifier>(modifier, 'explode')

export type PlusModifier<T extends NumberStringArgument = 'inclusive'> = Record<
  'plus',
  NumberString<T>
>
export const isPlusModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is PlusModifier<NumberStringArgument> =>
  isModifierType<PlusModifier<NumberStringArgument>>(modifier, 'plus')

export type MinusModifier<T extends NumberStringArgument = 'inclusive'> =
  Record<'minus', NumberString<T>>

export const isMinusModifier = (
  modifier: Modifier<NumberStringArgument>
): modifier is MinusModifier<NumberStringArgument> =>
  isModifierType<MinusModifier<NumberStringArgument>>(modifier, 'minus')

export type Modifier<T extends NumberStringArgument = 'inclusive'> =
  | CapModifier<T>
  | DropModifier<T>
  | ReplaceModifier<T>
  | RerollModifier<T>
  | ExplodeModifier
  | UniqueModifier<T>
  | PlusModifier<T>
  | MinusModifier<T>

function isMatcherType<T extends Match>(
  argument: Match,
  key: keyof T
): argument is T {
  return (argument as T)[key] !== undefined
}

export type CoreNotationMatch = { coreNotationMatch: string }
export const isCoreNotationMatch = (match: Match): match is CoreNotationMatch =>
  isMatcherType<CoreNotationMatch>(match, 'coreNotationMatch')

export type DropHighMatch = { dropHighMatch: string }
export const isDropHighMatch = (match: Match): match is DropHighMatch =>
  isMatcherType<DropHighMatch>(match, 'dropHighMatch')

export type DropLowMatch = { dropLowMatch: string }
export const isDropLowMatch = (match: Match): match is DropLowMatch =>
  isMatcherType<DropLowMatch>(match, 'dropLowMatch')

export type DropConstraintsMatch = { dropConstraintsMatch: string }
export const isDropConstraintsMatch = (
  match: Match
): match is DropConstraintsMatch =>
  isMatcherType<DropConstraintsMatch>(match, 'dropConstraintsMatch')

export type ExplodeMatch = { explodeMatch: string }
export const isExplodeMatch = (match: Match): match is ExplodeMatch =>
  isMatcherType<ExplodeMatch>(match, 'explodeMatch')

export type UniqueMatch = { uniqueMatch: string }
export const isUniqueMatch = (match: Match): match is UniqueMatch =>
  isMatcherType<UniqueMatch>(match, 'uniqueMatch')

export type ReplaceMatch = { replaceMatch: string }
export const isReplaceMatch = (match: Match): match is ReplaceMatch =>
  isMatcherType<ReplaceMatch>(match, 'replaceMatch')

export type RerollMatch = { rerollMatch: string }
export const isRerollMatch = (match: Match): match is RerollMatch =>
  isMatcherType<RerollMatch>(match, 'rerollMatch')

export type CapMatch = { capMatch: string }
export const isCapMatch = (match: Match): match is CapMatch =>
  isMatcherType<CapMatch>(match, 'capMatch')

export type PlusMatch = { plusMatch: string }
export const isPlusMatch = (match: Match): match is PlusMatch =>
  isMatcherType<PlusMatch>(match, 'plusMatch')

export type MinusMatch = { minusMatch: string }
export type Match =
  | CoreNotationMatch
  | DropHighMatch
  | DropLowMatch
  | DropConstraintsMatch
  | ExplodeMatch
  | UniqueMatch
  | ReplaceMatch
  | RerollMatch
  | CapMatch
  | PlusMatch
  | MinusMatch

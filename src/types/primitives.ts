export type CustomSide = number | string
export type StandardSide = number
export type NewDieType = StandardSide | CustomSide
export type DieType = 'standard' | 'customSides'

type DiceNotationWithNumericSides = `${number}${'d' | 'D'}${number}${string}`
type CustomDiceSidesNotation = `{${string}}`
type DiceNotationWithCustomSides = `${number}${
  | 'd'
  | 'D'}${CustomDiceSidesNotation}`

export type DiceNotation<T extends DieType = 'standard'> = T extends 'standard'
  ? DiceNotationWithNumericSides
  : DiceNotationWithCustomSides

export type NumberStringArgument = number | 'inclusive'

export type NumberString<T extends NumberStringArgument = 'inclusive'> =
  T extends 'inclusive' ? number | `${number}` : number

export type TypeOrArrayOfType<T> = T | T[]

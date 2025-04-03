export { isNumericRollOptions } from './guards'
export { BaseModifier } from './modifiers/BaseModifier'
export { CapModifier } from './modifiers/CapModifier'
export { DropModifier } from './modifiers/DropModifier'
export { ExplodeModifier } from './modifiers/ExplodeModifier'
export { MinusModifier } from './modifiers/MinusModifier'
export { PlusModifier } from './modifiers/PlusModifier'
export { ReplaceModifier } from './modifiers/ReplaceModifier'
export { RerollModifier } from './modifiers/RerollModifier'
export { UniqueModifier } from './modifiers/UniqueModifier'
export type {
  BaseRollOptions,
  ComparisonOptions,
  CustomDiceNotation,
  CustomRollOptions,
  DiceNotation,
  DropOptions,
  ModifierOptions,
  NumericDiceNotation,
  NumericRollBonus,
  NumericRollOptions,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  RollOptions,
  UniqueOptions
} from './types'
export { extractMatches } from './utils/extractMatches'
export { formatters } from './utils/formatters'
export { InvalidUniqueError } from './utils/invalidUniqueError'
export { optionsConverter } from './utils/optionsConverter'

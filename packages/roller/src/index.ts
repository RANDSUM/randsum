export { roll } from './roll'

export * from './validate'
export * from './errors'
export type {
  CustomFacesNotation,
  DiceNotation,
  DrawDieNotation,
  GeometricDieNotation,
  FateDieNotation,
  PercentileDie,
  RandomFn,
  RollOptions,
  RollArgument,
  RollConfig,
  ZeroBiasNotation
} from './types/core'

export type {
  ComparisonOptions,
  CountOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  ModifierOptions
} from './types/modifiers'

export type { RollRecord, RollerRollResult } from './types/results'

export type { ValidationErrorInfo, ValidationResult } from './notation/types'

export { notationToOptions } from './notation/parse/notationToOptions'
export { optionsToNotation } from './notation/transformers/optionsToNotation'
export { optionsToDescription } from './notation/transformers/optionsToDescription'
export {
  modifiersToNotation,
  modifiersToDescription
} from './notation/transformers/modifiersToStrings'
export { tokenize } from './notation/tokenize'
export type { Token, TokenCategory, ModifierCategory } from './notation/tokenize'
export { suggestNotationFix } from './notation/suggestions'

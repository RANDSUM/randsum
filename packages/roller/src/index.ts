export { roll } from './roll'
export { validateNotation } from './validateNotation'
export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './lib/transformers'
export { isDiceNotation, notation } from './isDiceNotation'
export type { RandomFn } from './lib/random'
export { RandsumError } from '@randsum/shared'
export { NotationParseError, ModifierError, ValidationErrorClass, RollError } from './errors'

export type {
  DiceNotation,
  RollArgument,
  RollConfig,
  RollOptions,
  RequiredNumericRollParameters,
  ComparisonOptions,
  DropOptions,
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions,
  RollParams,
  RollRecord,
  RollResult,
  RollerRollResult,
  InvalidValidationResult,
  ValidValidationResult,
  ValidationResult,
  ValidationError
} from './types'

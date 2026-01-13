export { roll } from './roll'
export { validateNotation } from './validateNotation'
export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './lib/transformers'
export { isDiceNotation, notation } from './isDiceNotation'
export type { RandomFn } from './lib/random'
export { NotationParseError, ModifierError, ValidationErrorClass, RollError } from './errors'

// Shared utilities (previously @randsum/shared)
export {
  RandsumError,
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan,
  isSuccess,
  isError,
  success,
  error
} from './shared'
export type { GameRollResult, Result, SuccessResult, ErrorResult } from './shared'

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

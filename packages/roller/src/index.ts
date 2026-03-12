export { roll } from './internal/api'

export { validateNotation, isDiceNotation, notation } from './internal/api'

export { validateInteger, validateRange, validateNonNegative, validateFinite } from './internal/api'

export {
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError,
  ERROR_CODES
} from './internal/api'

export type {
  DiceNotation,
  ParsedNotationOptions,
  RollArgument,
  RollConfig,
  RollOptions,
  RequiredNumericRollParameters,
  RandomFn,
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  SuccessCountOptions,
  UniqueOptions,
  RollParams,
  RollRecord,
  RollerRollResult,
  InvalidValidationResult,
  ValidValidationResult,
  ValidationErrorInfo,
  ValidationResult
} from './internal/publicTypes'

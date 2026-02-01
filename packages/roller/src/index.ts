export { roll } from './internal/api'

export { validateNotation, isDiceNotation, notation } from './internal/api'
export { validateRollOptions } from './internal/api'

export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './internal/api'

export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from './internal/api'

export {
  ERROR_CODES,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError
} from './internal/api'

export type { ErrorCode } from './internal/api'

export { analyze } from './internal/api'

export { PRESETS, resolvePreset, resolvePresetParam } from './internal/api'

export { createGameRoll, createMultiRollGameRoll } from './internal/api'

export type {
  DiceNotation,
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
  RollResult,
  RollerRollResult,
  InvalidValidationResult,
  ValidValidationResult,
  ValidationErrorInfo,
  ValidationResult,
  GameRollResult,
  ProbabilityAnalysis,
  GameRollConfig,
  MultiRollGameConfig
} from './internal/publicTypes'

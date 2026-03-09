export { roll } from './internal/api'

export { validateNotation, isDiceNotation, notation } from './internal/api'
export { validateRollOptions } from './internal/api'

export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './internal/api'

export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan
} from './internal/api'

export {
  ERROR_CODES,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError
} from './internal/api'

export { PRESETS, resolvePreset, resolvePresetParam } from './internal/api'

export { createGameRoll, createMultiRollGameRoll } from './internal/api'

export {
  matchesComparison,
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation,
  hasConditions
} from './internal/api'

export { MODIFIER_PRIORITIES } from './internal/api'

export { formatResult, isFormattedError } from './internal/api'

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
  RollerRollResult,
  InvalidValidationResult,
  ValidValidationResult,
  ValidationErrorInfo,
  ValidationResult,
  GameRollResult
} from './internal/publicTypes'

export { roll, tryRoll } from './roll'
export { validateNotation } from './validateNotation'
export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './lib/transformers'
export { isDiceNotation, notation, tryNotation } from './isDiceNotation'
export type { RandomFn } from './lib/random'
export { NotationParseError, ModifierError, ValidationErrorClass, RollError } from './errors'
export { createGameRoll, createMultiRollGameRoll } from './lib/gameRoll'
export type { GameRollConfig, MultiRollGameConfig } from './lib/gameRoll'

// Shared utilities (previously @randsum/shared)
export { RandsumError } from './errors'
export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from './lib/validation'
export { validateRollOptions } from './lib/optionsValidation'
export { isSuccess, isError, success, error } from './lib/result'
export type { GameRollResult } from './types'
export type { Result, SuccessResult, ErrorResult } from './lib/result'
export { analyze } from './lib/probability'
export type { ProbabilityAnalysis } from './lib/probability'
export { PRESETS, resolvePreset, resolvePresetParam } from './presets'

export type {
  DiceNotation,
  RollArgument,
  RollConfig,
  RollOptions,
  RequiredNumericRollParameters,
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
  ValidationResult,
  ValidationError
} from './types'

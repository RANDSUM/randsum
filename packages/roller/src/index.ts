// ============================================================================
// @randsum/roller - Public API
// ============================================================================
// This is the public entry point for the package.
// All exports are organized through the internal API layer.

// ============================================================================
// Functions
// ============================================================================

// Core roll functions
export { roll, tryRoll } from './internal/api'

// Validation
export { validateNotation, isDiceNotation, notation, tryNotation } from './internal/api'
export { validateRollOptions } from './internal/api'

// Transformers
export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from './internal/api'

// Result utilities
export { isSuccess, isError, success, error } from './internal/api'

// Validation utilities
export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from './internal/api'

// Error classes
export {
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationErrorClass,
  RollError
} from './internal/api'

// Probability analysis
export { analyze } from './internal/api'

// Presets
export { PRESETS, resolvePreset, resolvePresetParam } from './internal/api'

// Game roll factories
export { createGameRoll, createMultiRollGameRoll } from './internal/api'

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  DiceNotation,
  RollArgument,
  RollConfig,
  RollOptions,
  RequiredNumericRollParameters,
  RandomFn,
  // Modifier types
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
  // Result types
  RollParams,
  RollRecord,
  RollResult,
  RollerRollResult,
  // Validation types
  InvalidValidationResult,
  ValidValidationResult,
  ValidationError,
  ValidationResult,
  // Game types
  GameRollResult,
  // Result pattern types
  Result,
  SuccessResult,
  ErrorResult,
  // Probability types
  ProbabilityAnalysis,
  // Game roll config types
  GameRollConfig,
  MultiRollGameConfig
} from './internal/publicTypes'

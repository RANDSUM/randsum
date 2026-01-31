// ============================================================================
// Types Index - Re-exports all types for backward compatibility
// ============================================================================

// Core types
export type {
  DiceNotation,
  RollOptions,
  RequiredNumericRollParameters,
  RollArgument,
  RollConfig
} from './core'

// Modifier types
export type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  SuccessCountOptions,
  ModifierConfig,
  ModifierOptions,
  ModifierLog,
  NumericRollBonus
} from './modifiers'

// Result types
export type { RollParams, RollRecord, RollResult, RollerRollResult } from './results'

// Validation types
export type {
  ValidValidationResult,
  InvalidValidationResult,
  ValidationError,
  ValidationResult
} from './validation'

// Game types
export type { GameRollResult } from './game'

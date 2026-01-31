// ============================================================================
// Internal Types - All public types exported from the package
// ============================================================================
// This module consolidates all public type exports.
// Refactoring internal paths does not affect this file.

// Core types
export type {
  DiceNotation,
  RollArgument,
  RollConfig,
  RollOptions,
  RequiredNumericRollParameters
} from '../types/core'

// Random function type (canonical source)
export type { RandomFn } from '../lib/random'

// Modifier types
export type {
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
  UniqueOptions
} from '../types/modifiers'

// Result types
export type { RollParams, RollRecord, RollResult, RollerRollResult } from '../types/results'

// Validation types
export type {
  InvalidValidationResult,
  ValidValidationResult,
  ValidationError,
  ValidationResult
} from '../types/validation'

// Game types
export type { GameRollResult } from '../types/game'

// Result pattern types
export type { Result, SuccessResult, ErrorResult } from '../lib/utils'

// Probability types
export type { ProbabilityAnalysis } from '../lib/probability'

// Game roll config types
export type { GameRollConfig, MultiRollGameConfig } from '../lib/gameRoll'

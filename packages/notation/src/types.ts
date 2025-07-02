import type {
  CustomDiceNotation,
  CustomRollOptions,
  NumericDiceNotation,
  NumericRollOptions
} from '@randsum/core'

// -----------------------
// --- VALIDATION ---
// -----------------------

interface BaseValidationResult {
  valid: boolean
  type: 'numeric' | 'custom' | 'invalid'
  description: string[]
}

export interface NumericValidationResult extends BaseValidationResult {
  valid: true
  type: 'numeric'
  digested: NumericRollOptions
  notation: NumericDiceNotation
}

export interface CustomValidationResult extends BaseValidationResult {
  valid: true
  type: 'custom'
  digested: CustomRollOptions
  notation: CustomDiceNotation
}

export interface InvalidValidationResult extends BaseValidationResult {
  valid: false
  type: 'invalid'
  digested: Record<string, never>
}

export type ValidationResult =
  | NumericValidationResult
  | CustomValidationResult
  | InvalidValidationResult

export type {
  BaseRollOptions,
  CustomDiceNotation,
  CustomRollOptions,
  DiceNotation,
  ModifierOptions,
  NumericDiceNotation,
  NumericRollOptions,
  RollOptions
} from '@randsum/core'

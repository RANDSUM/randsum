import type { DiceNotation, RollOptions } from './core'

/**
 * Successful validation result.
 *
 * Returned when dice notation is valid.
 */
export interface ValidValidationResult {
  /** Indicates successful validation */
  valid: true
  /** Original input as DiceNotation */
  argument: DiceNotation
  /** Human-readable descriptions for each roll */
  description: string[][]
  /** Parsed roll options for each roll */
  options: RollOptions[]
  /** Notation strings for each roll */
  notation: DiceNotation[]
  /** No error on success */
  error: null
}

/**
 * Failed validation result.
 *
 * Returned when dice notation is invalid.
 */
export interface InvalidValidationResult {
  /** Indicates failed validation */
  valid: false
  /** Original input string */
  argument: string
  /** Error information */
  error: ValidationErrorInfo
}

/**
 * Error information from validation.
 * Note: This is different from the ValidationError class in errors.ts.
 * This is a plain object describing what went wrong during validation.
 */
export interface ValidationErrorInfo {
  /** Description of what's wrong */
  message: string
  /** The input that failed validation */
  argument: string
}

/**
 * Result of notation validation.
 *
 * Either a ValidValidationResult (valid: true, error: null) or
 * InvalidValidationResult (valid: false, error: ValidationErrorInfo).
 */
export type ValidationResult = ValidValidationResult | InvalidValidationResult

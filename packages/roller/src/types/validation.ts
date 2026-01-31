// ============================================================================
// Validation Types - Types for notation validation results
// ============================================================================

import type { Result } from '../lib/utils'
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
}

/**
 * Error information from validation.
 */
export interface ValidationError {
  /** Description of what's wrong */
  message: string
  /** The input that failed validation */
  argument: string
}

/**
 * Result of notation validation using Result pattern.
 *
 * Either a successful ValidValidationResult or a ValidationError.
 */
export type ValidationResult = Result<ValidValidationResult, ValidationError>

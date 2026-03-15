/**
 * Centralized error codes for all RANDSUM errors.
 * Use these constants instead of raw strings for consistency.
 */
export const ERROR_CODES: Record<string, string> & {
  readonly INVALID_NOTATION: 'INVALID_NOTATION'
  readonly MODIFIER_ERROR: 'MODIFIER_ERROR'
  readonly VALIDATION_ERROR: 'VALIDATION_ERROR'
  readonly ROLL_ERROR: 'ROLL_ERROR'
} = {
  /** Invalid dice notation syntax */
  INVALID_NOTATION: 'INVALID_NOTATION',
  /** Error applying a modifier */
  MODIFIER_ERROR: 'MODIFIER_ERROR',
  /** Input validation failed */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** General roll execution error */
  ROLL_ERROR: 'ROLL_ERROR'
} as const satisfies Record<string, string>

export type ErrorCode =
  | (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
  | (string & Record<never, never>)

/**
 * Base error class for all RANDSUM errors.
 * All custom errors in the RANDSUM ecosystem should extend this class.
 */
export class RandsumError extends Error {
  public readonly code: ErrorCode

  constructor(message: string, code: ErrorCode) {
    super(message)
    this.name = 'RandsumError'
    this.code = code
  }
}

export { NotationParseError } from '@randsum/notation'

export class ModifierError extends RandsumError {
  constructor(modifierType: string, reason: string) {
    super(`Modifier error for "${modifierType}": ${reason}`, ERROR_CODES.MODIFIER_ERROR)
    this.name = 'ModifierError'
  }
}

export class ValidationError extends RandsumError {
  constructor(message: string) {
    super(`Validation error: ${message}`, ERROR_CODES.VALIDATION_ERROR)
    this.name = 'ValidationError'
  }
}

export class RollError extends RandsumError {
  constructor(message: string) {
    super(message, ERROR_CODES.ROLL_ERROR)
    this.name = 'RollError'
  }
}

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
 * Optional structured context for a RANDSUM error.
 *
 * Populated by throw sites that know additional details about the failure.
 * Consumers may read any of these fields to present richer diagnostics
 * (e.g. highlight the offending character in an input, show which option
 * field failed validation, log the raw value that triggered the error).
 *
 * All fields are optional — throw sites only include what they know.
 */
export interface ErrorContext {
  /** Dotted path to the offending option field, e.g. `'quantity'`, `'modifiers.drop.lowest'`. */
  readonly path?: string
  /** The offending value (kept as `unknown` so callers type-narrow before use). */
  readonly value?: unknown
  /** The notation string associated with the failure, when relevant. */
  readonly notation?: string
  /** Zero-indexed character offset in the notation string, when known. */
  readonly position?: number
}

/**
 * Base error class for all RANDSUM errors.
 * All custom errors in the RANDSUM ecosystem should extend this class.
 */
export class RandsumError extends Error {
  public readonly code: ErrorCode
  public readonly context: ErrorContext | undefined

  constructor(message: string, code: ErrorCode, context?: ErrorContext) {
    super(message)
    this.name = 'RandsumError'
    this.code = code
    this.context = context
  }
}

/**
 * Error thrown when a string is not valid dice notation.
 */
export class NotationParseError extends RandsumError {
  public readonly suggestion: string | undefined

  constructor(notation: string, reason: string, suggestion?: string, context?: ErrorContext) {
    const message = suggestion
      ? `Invalid notation "${notation}": ${reason}. Did you mean "${suggestion}"?`
      : `Invalid notation "${notation}": ${reason}`
    // Ensure the notation is always available on context when not explicitly overridden.
    const mergedContext: ErrorContext = { notation, ...context }
    super(message, ERROR_CODES.INVALID_NOTATION, mergedContext)
    this.name = 'NotationParseError'
    this.suggestion = suggestion
  }
}

export class ModifierError extends RandsumError {
  constructor(modifierType: string, reason: string, context?: ErrorContext) {
    super(`Modifier error for "${modifierType}": ${reason}`, ERROR_CODES.MODIFIER_ERROR, context)
    this.name = 'ModifierError'
  }
}

export class ValidationError extends RandsumError {
  constructor(message: string, context?: ErrorContext) {
    super(`Validation error: ${message}`, ERROR_CODES.VALIDATION_ERROR, context)
    this.name = 'ValidationError'
  }
}

export class RollError extends RandsumError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ERROR_CODES.ROLL_ERROR, context)
    this.name = 'RollError'
  }
}

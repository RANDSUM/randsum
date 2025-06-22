/**
 * @file Base error class for RANDSUM with enhanced error handling capabilities
 * @module @randsum/core/utils/randsumError
 */

/**
 * Error codes for programmatic error handling
 *
 * Using string literal union type instead of enum for better tree-shaking
 * and simpler JavaScript output following modern TypeScript best practices.
 */
export type RandsumErrorCode =
  /** Invalid dice notation format */
  | 'INVALID_NOTATION'
  /** Conflicting modifiers applied to dice */
  | 'MODIFIER_CONFLICT'
  /** Roll constraint violation (e.g., unique rolls impossible) */
  | 'ROLL_CONSTRAINT'
  /** Invalid die configuration */
  | 'INVALID_DIE_CONFIG'
  /** Invalid modifier options */
  | 'INVALID_MODIFIER_OPTIONS'
  /** Generic validation error */
  | 'VALIDATION_ERROR'

/**
 * Context information for error debugging
 */
export interface ErrorContext {
  /** The input that caused the error */
  input?: string | number | object
  /** Expected format or value */
  expected?: string
  /** Additional context-specific data */
  details?: Record<string, unknown>
  /** Location where the error occurred */
  location?: string
}

/**
 * Base error class for RANDSUM with enhanced error handling capabilities
 *
 * This class extends the standard Error class to provide:
 * - Structured error codes for programmatic handling
 * - Rich context information for debugging
 * - Helpful suggestions for error resolution
 * - Consistent error formatting across the RANDSUM ecosystem
 *
 * @example
 * ```typescript
 * throw new RandsumError(
 *   'Invalid dice notation provided',
 *   'INVALID_NOTATION',
 *   { input: '4d6x', expected: 'Valid dice notation like "4d6" or "4d6L"' },
 *   ['Check the dice notation format', 'Use "4d6L" to drop the lowest roll']
 * )
 * ```
 */
export class RandsumError extends Error {
  /** Error code for programmatic handling */
  public readonly code: RandsumErrorCode

  /** Context information for debugging */
  public readonly context: ErrorContext

  /** Helpful suggestions for resolving the error */
  public readonly suggestions: string[]

  /** Timestamp when the error was created */
  public readonly timestamp: Date

  /**
   * Creates a new RandsumError instance
   *
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param context - Context information for debugging
   * @param suggestions - Array of helpful suggestions for resolving the error
   */
  constructor(
    message: string,
    code: RandsumErrorCode,
    context: ErrorContext = {},
    suggestions: string[] = []
  ) {
    super(message)

    this.name = 'RandsumError'
    this.code = code
    this.context = context
    this.suggestions = suggestions
    this.timestamp = new Date()

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RandsumError.prototype)
  }

  /**
   * Returns a detailed string representation of the error
   *
   * @returns Formatted error string with context and suggestions
   */
  public override toString(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`

    if (this.context.input !== undefined) {
      result += `\n  Input: ${JSON.stringify(this.context.input)}`
    }

    if (this.context.expected) {
      result += `\n  Expected: ${this.context.expected}`
    }

    if (this.context.location) {
      result += `\n  Location: ${this.context.location}`
    }

    if (this.suggestions.length > 0) {
      result += '\n  Suggestions:'
      this.suggestions.forEach(suggestion => {
        result += `\n    • ${suggestion}`
      })
    }

    return result
  }

  /**
   * Returns a JSON representation of the error
   *
   * @returns Serializable error object
   */
  public toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      suggestions: this.suggestions,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }

  /**
   * Creates a RandsumError from a standard Error
   *
   * @param error - Standard Error to convert
   * @param code - Error code to assign
   * @param context - Additional context information
   * @param suggestions - Helpful suggestions
   * @returns New RandsumError instance
   */
  public static fromError(
    error: Error,
    code: RandsumErrorCode,
    context: ErrorContext = {},
    suggestions: string[] = []
  ): RandsumError {
    const randsumError = new RandsumError(error.message, code, context, suggestions)
    randsumError.stack = error.stack
    return randsumError
  }
}

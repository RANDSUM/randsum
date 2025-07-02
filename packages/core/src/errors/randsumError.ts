export type RandsumErrorCode =
  | 'INVALID_NOTATION'
  | 'MODIFIER_CONFLICT'
  | 'ROLL_CONSTRAINT'
  | 'INVALID_DIE_CONFIG'
  | 'INVALID_MODIFIER_OPTIONS'
  | 'VALIDATION_ERROR'

export interface ErrorContext {
  input?: string | number | object
  expected?: string
  details?: Record<string, unknown>
  location?: string
}

export class RandsumError extends Error {
  public readonly code: RandsumErrorCode

  public readonly context: ErrorContext

  public readonly suggestions: string[]

  public readonly timestamp: Date

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

    Object.setPrototypeOf(this, RandsumError.prototype)
  }

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
      this.suggestions.forEach((suggestion) => {
        result += `\n    • ${suggestion}`
      })
    }

    return result
  }

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

  public static fromError(
    error: Error,
    code: RandsumErrorCode,
    context: ErrorContext = {},
    suggestions: string[] = []
  ): RandsumError {
    const randsumError = new RandsumError(
      error.message,
      code,
      context,
      suggestions
    )
    randsumError.stack = error.stack
    return randsumError
  }
}

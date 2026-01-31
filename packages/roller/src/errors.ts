// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for all RANDSUM errors.
 * All custom errors in the RANDSUM ecosystem should extend this class.
 */
export class RandsumError extends Error {
  public readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'RandsumError'
    this.code = code
  }
}

export class NotationParseError extends RandsumError {
  public readonly suggestion: string | undefined

  constructor(notation: string, reason: string, suggestion?: string) {
    const message = suggestion
      ? `Invalid notation "${notation}": ${reason}. Did you mean "${suggestion}"?`
      : `Invalid notation "${notation}": ${reason}`
    super(message, 'INVALID_NOTATION')
    this.name = 'NotationParseError'
    this.suggestion = suggestion
  }
}

export class ModifierError extends RandsumError {
  constructor(modifierType: string, reason: string) {
    super(`Modifier error for "${modifierType}": ${reason}`, 'MODIFIER_ERROR')
    this.name = 'ModifierError'
  }
}

export class ValidationErrorClass extends RandsumError {
  constructor(message: string) {
    super(`Validation error: ${message}`, 'VALIDATION_ERROR')
    this.name = 'ValidationErrorClass'
  }
}

export class RollError extends RandsumError {
  constructor(message: string) {
    super(message, 'ROLL_ERROR')
    this.name = 'RollError'
  }
}

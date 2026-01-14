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
  constructor(notation: string, reason: string) {
    super(`Invalid notation "${notation}": ${reason}`, 'INVALID_NOTATION')
    this.name = 'NotationParseError'
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

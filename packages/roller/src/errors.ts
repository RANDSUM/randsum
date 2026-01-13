// ============================================================================
// Error Types
// ============================================================================

import { RandsumError } from './shared'

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

import { ModifierConflictError, optionsConverter } from '@randsum/core'
import { isDiceNotation } from './isDiceNotation'
import type { ValidationResult } from './types'
import { notationToOptions } from './utils/notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {},
      type: 'invalid'
    }
  }

  try {
    const digested = notationToOptions(notation)
    return {
      valid: true,
      digested,
      notation: optionsConverter.toNotation(digested),
      type: calculateDieType(digested.sides),
      description: optionsConverter.toDescription(digested)
    } as ValidationResult
  } catch {
    const error = ModifierConflictError.forCustomDiceWithModifiers(notation)
    return {
      valid: false,
      description: [error.message, ...error.suggestions],
      digested: {},
      type: 'invalid'
    }
  }
}

function calculateDieType(sides: number | string[]): 'custom' | 'numeric' {
  if (Array.isArray(sides)) {
    return 'custom'
  }
  return 'numeric'
}

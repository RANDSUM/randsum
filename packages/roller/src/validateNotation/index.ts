import {
  ModifierConflictError,
  OptionsConverter,
  isCustomValidationResult,
  isDiceNotation,
  isNumericValidationResult
} from '../lib'
import type { ValidationResult } from '../types'
import { calculateDieType } from './calculateDieType'
import { notationToOptions } from './notationToOptions'

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
    const converter = new OptionsConverter(digested)
    const proposed = {
      valid: true,
      digested,
      notation: converter.toNotation,
      type: calculateDieType(digested.sides),
      description: converter.toDescription
    }
    if (
      isNumericValidationResult(proposed) ||
      isCustomValidationResult(proposed)
    ) {
      return proposed
    }

    throw new Error('Failed to validate notation. Please try again.')
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

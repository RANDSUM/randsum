import { ModifierConflictError, OptionsConverter, isDiceNotation } from '../lib'
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
    return {
      valid: true,
      digested,
      notation: converter.toNotation,
      type: calculateDieType(digested.sides),
      description: converter.toDescription
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

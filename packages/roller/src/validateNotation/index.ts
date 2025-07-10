import {
  OptionsConverter,
  isCustomValidationResult,
  isDiceNotation,
  isNumericValidationResult
} from '../lib'
import type { ValidationResult } from '../types'
import { notationToOptions } from './notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {}
    }
  }

  const digested = notationToOptions(notation)
  const converter = new OptionsConverter(digested)
  const proposed = {
    valid: true,
    digested,
    notation: converter.toNotation,
    description: converter.toDescription
  }
  if (
    isNumericValidationResult(proposed) ||
    isCustomValidationResult(proposed)
  ) {
    return proposed
  }

  return {
    valid: false,
    description: ['Failed to validate notation. Please try again.'],
    digested: {}
  }
}

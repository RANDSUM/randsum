import {
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

  return {
    valid: false,
    description: ['Failed to validate notation. Please try again.'],
    digested: {},
    type: 'invalid'
  }
}

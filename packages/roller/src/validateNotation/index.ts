import { OptionsConverter, isDiceNotation } from '../lib'
import type { ValidationResult } from '../types'
import { notationToOptions } from './notationToOptions'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {},
      notation
    }
  }

  const digested = notationToOptions(notation)
  const converter = new OptionsConverter(digested)
  return {
    valid: true,
    digested,
    notation: converter.toNotation,
    description: converter.toDescription
  }
}

import { isDiceNotation } from '../isDiceNotation'
import type { ValidationResult } from '../types/validation'
import { optionsToDescription, optionsToNotation } from '../lib/transformers'
import { notationToOptions } from '../lib/notation'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      argument: notation
    }
  }

  const options = notationToOptions(notation)
  return {
    valid: true,
    argument: notation,
    options,
    notation: options.map((o) => optionsToNotation(o)),
    description: options.map((o) => optionsToDescription(o))
  }
}

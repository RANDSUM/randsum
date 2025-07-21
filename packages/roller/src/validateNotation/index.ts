import { isDiceNotation } from '../isDiceNotation'
import type { ValidationResult } from '../types'
import {
  notationToOptions,
  optionsToDescription,
  optionsToNotation
} from '../lib/utils'

export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      options: {}
    }
  }

  const options = notationToOptions(notation)
  return {
    valid: true,
    options,
    notation: optionsToNotation(options),
    description: optionsToDescription(options)
  }
}

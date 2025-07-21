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

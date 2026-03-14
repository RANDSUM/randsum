import { isDiceNotation } from './isDiceNotation'
import { notationToOptions } from './parse/notationToOptions'
import type { InvalidValidationResult, ValidValidationResult, ValidationResult } from './types'
import { optionsToDescription, optionsToNotation } from './transform'

/**
 * Validates dice notation and returns parsed information.
 *
 * @param notation - String to validate as dice notation
 * @returns ValidationResult with valid flag and error (if invalid)
 */
export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    const result: InvalidValidationResult = {
      valid: false,
      argument: notation,
      error: {
        message: `Invalid dice notation: "${notation}"`,
        argument: notation
      }
    }
    return result
  }

  const options = notationToOptions(notation)
  const result: ValidValidationResult = {
    valid: true,
    argument: notation,
    options,
    notation: options.map(o => optionsToNotation(o)),
    description: options.map(o => optionsToDescription(o)),
    error: null
  }
  return result
}

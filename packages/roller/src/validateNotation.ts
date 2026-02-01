import { isDiceNotation } from './isDiceNotation'
import type { InvalidValidationResult, ValidValidationResult, ValidationResult } from './types'
import { optionsToDescription, optionsToNotation } from './lib/transformers'
import { notationToOptions } from './lib/notation'

/**
 * Validates dice notation and returns parsed information.
 *
 * Checks if a string is valid RANDSUM dice notation and returns detailed
 * information about the parsed structure if valid.
 *
 * @param notation - String to validate as dice notation
 * @returns ValidationResult with valid flag and error (if invalid)
 *
 * @example
 * ```ts
 * const result = validateNotation("4d6L")
 * if (result.valid) {
 *   console.log(result.options) // Parsed roll options
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
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

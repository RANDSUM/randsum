import { isDiceNotation } from './isDiceNotation'
import type { ValidValidationResult, ValidationError, ValidationResult } from './types'
import { optionsToDescription, optionsToNotation } from './lib/transformers'
import { notationToOptions } from './lib/notation'
import { error, success } from './lib/result'

/**
 * Validates dice notation and returns parsed information.
 *
 * Checks if a string is valid RANDSUM dice notation and returns detailed
 * information about the parsed structure if valid.
 *
 * @param notation - String to validate as dice notation
 * @returns Result type with success flag, data on success, or error on failure
 *
 * @example
 * ```ts
 * const result = validateNotation("4d6L")
 * if (result.success) {
 *   console.log(result.data.options) // Parsed roll options
 * } else {
 *   console.error(result.error.message)
 * }
 * ```
 */
export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    const validationError: ValidationError = {
      message: `Invalid dice notation: "${notation}"`,
      argument: notation
    }
    return error(validationError)
  }

  const options = notationToOptions(notation)
  const data: ValidValidationResult = {
    valid: true,
    argument: notation,
    options,
    notation: options.map(o => optionsToNotation(o)),
    description: options.map(o => optionsToDescription(o))
  }
  return success(data)
}

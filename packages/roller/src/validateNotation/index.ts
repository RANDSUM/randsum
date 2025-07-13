import { OptionsConverter, isDiceNotation } from '../lib'
import type { ValidationResult } from '../types'
import { notationToOptions } from './notationToOptions'

/**
 * Validate dice notation string and return parsed result.
 *
 * @param notation - Dice notation string to validate
 * @returns Validation result with parsed options if valid
 *
 * @example
 * ```typescript
 * const result = validateNotation("4d6L+2")
 * if (result.valid) {
 *   console.log(result.description) // Human-readable description
 *   console.log(result.notation)    // Normalized notation
 *   console.log(result.digested)    // Parsed options object
 * } else {
 *   console.error("Invalid notation")
 * }
 * ```
 */
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
  return {
    valid: true,
    digested,
    notation: converter.toNotation,
    description: converter.toDescription
  }
}

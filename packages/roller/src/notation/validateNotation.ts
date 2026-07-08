import { parseNotation } from './lexer/parse'
import { notationToOptions } from './parse/notationToOptions'
import type { DiceNotation } from './types'
import type { InvalidValidationResult, ValidValidationResult, ValidationResult } from './types'
import { optionsToDescription } from './transformers/optionsToDescription'
import { optionsToNotation } from './transformers/optionsToNotation'

/**
 * Validates dice notation and returns parsed information.
 *
 * Both validity and error position come from the single cursor parser, so an
 * invalid result reports the real character offset where parsing failed
 * (`error.position`) instead of a generic message.
 *
 * @param notation - String to validate as dice notation
 * @returns ValidationResult with valid flag and error (if invalid)
 */
export function validateNotation(notation: string): ValidationResult {
  const parsed = typeof notation === 'string' ? parseNotation(notation) : null

  if (!parsed?.valid) {
    const result: InvalidValidationResult = {
      valid: false,
      argument: notation,
      error: {
        message: `Invalid dice notation: "${notation}"`,
        argument: notation,
        ...(parsed?.error ? { position: parsed.error.position } : {})
      }
    }
    return result
  }

  const options = notationToOptions(notation)
  const result: ValidValidationResult = {
    valid: true,
    argument: notation as DiceNotation,
    options,
    notation: options.map(o => optionsToNotation(o)),
    description: options.map(o => optionsToDescription(o)),
    error: null
  }
  return result
}

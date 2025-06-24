import { ModifierConflictError, optionsConverter } from '@randsum/core'
import { isDiceNotation } from './isDiceNotation'
import type { DiceNotation, RollOptions, ValidationResult } from './types'
import { notationToOptions } from './utils/notationToOptions'

/**
 * Validates and parses dice notation into a structured result
 *
 * This function takes a dice notation string and validates it according to
 * RANDSUM rules, then parses it into a structured format with human-readable
 * descriptions. It handles both numeric dice (e.g., "4d6") and custom dice
 * (e.g., "2d{H,T}") but enforces that custom dice cannot use modifiers.
 *
 * @param notation - The dice notation string to validate and parse
 *
 * @returns A validation result object containing:
 *   - `valid`: Whether the notation is valid
 *   - `description`: Human-readable description of the roll
 *   - `digested`: Parsed options object (if valid)
 *   - `type`: Type of dice ('numerical', 'custom', or 'invalid')
 *   - `notation`: Normalized notation string (if valid)
 *
 * @example
 * // Valid numeric notation
 * validateNotation('4d6L')
 * // Returns: { valid: true, type: 'numerical', description: [...], ... }
 *
 * @example
 * // Valid custom notation
 * validateNotation('2d{H,T}')
 * // Returns: { valid: true, type: 'custom', description: [...], ... }
 *
 * @example
 * // Invalid notation
 * validateNotation('invalid')
 * // Returns: { valid: false, type: 'invalid', description: ['Invalid Notation'], ... }
 *
 * @example
 * // Invalid: custom dice with modifiers
 * validateNotation('2d{H,T}L')
 * // Returns: { valid: false, type: 'invalid', description: ['Custom dice faces cannot be used with modifiers'], ... }
 */
export function validateNotation(notation: string): ValidationResult {
  if (!isDiceNotation(notation)) {
    return {
      valid: false,
      description: ['Invalid Notation'],
      digested: {},
      type: 'invalid'
    }
  }

  try {
    const digested = notationToOptions(notation)
    return {
      valid: true,
      digested,
      notation: optionsConverter.toNotation(digested),
      type: calculateDieType(digested.sides),
      description: optionsConverter.toDescription(digested)
    } as ValidationResult
  } catch {
    const error = ModifierConflictError.forCustomDiceWithModifiers(notation)
    return {
      valid: false,
      description: [error.message, ...error.suggestions],
      digested: {},
      type: 'invalid'
    }
  }
}

/**
 * Determines the type of die based on its sides configuration
 *
 * @param sides - Either a number (for standard dice) or array of strings (for custom faces)
 * @returns 'custom' for custom dice faces, 'numerical' for standard numbered dice
 * @internal
 */
function calculateDieType(sides: number | string[]): 'custom' | 'numerical' {
  if (Array.isArray(sides)) {
    return 'custom'
  }
  return 'numerical'
}

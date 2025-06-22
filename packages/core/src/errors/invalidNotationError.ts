/**
 * @file Invalid notation error for dice notation parsing
 * @module @randsum/core/utils/invalidNotationError
 */

import { type ErrorContext, RandsumError } from './randsumError'

/**
 * Error thrown when invalid dice notation is provided
 *
 * This error is thrown when dice notation cannot be parsed or contains
 * invalid syntax. It provides helpful suggestions for common notation
 * mistakes and formatting issues.
 *
 * @example
 * ```typescript
 * // This would throw an InvalidNotationError
 * validateNotation('4d6x') // 'x' is not a valid modifier
 *
 * // Error includes suggestions like:
 * // "Did you mean '4d6L' to drop the lowest roll?"
 * // "Use '4d6H' to keep the highest roll"
 * ```
 */
export class InvalidNotationError extends RandsumError {
  /**
   * Creates a new InvalidNotationError instance
   *
   * @param notation - The invalid notation that was provided
   * @param reason - Specific reason why the notation is invalid
   * @param suggestions - Array of helpful suggestions (auto-generated if not provided)
   */
  constructor(
    notation: string,
    reason?: string,
    suggestions?: string[]
  ) {
    const message = `Invalid dice notation: ${reason ?? notation}`

    const context: ErrorContext = {
      input: notation,
      expected: 'Valid dice notation like "4d6", "2d20H", or "3d8+2"',
      location: 'notation parsing'
    }

    const autoSuggestions = suggestions ?? InvalidNotationError.generateSuggestions(notation)

    super(message, 'INVALID_NOTATION', context, autoSuggestions)
    this.name = 'InvalidNotationError'
  }

  /**
   * Generates helpful suggestions based on common notation mistakes
   *
   * @param notation - The invalid notation
   * @returns Array of suggestions
   * @internal
   */
  private static generateSuggestions(notation: string): string[] {
    const suggestions: string[] = []

    // Common case mistakes
    if (notation.includes('l')) {
      suggestions.push(`Did you mean '${notation.replace(/l/g, 'L')}' to drop the lowest roll?`)
    }
    if (notation.includes('h')) {
      suggestions.push(`Did you mean '${notation.replace(/h/g, 'H')}' to keep the highest roll?`)
    }

    // Missing 'd' separator
    if (/^\d+\d+/.test(notation)) {
      const match = /^(\d+)(\d+.*)$/.exec(notation)
      if (match) {
        suggestions.push(`Did you mean '${match[1] ?? ''}d${match[2] ?? ''}'?`)
      }
    }

    // Invalid modifiers
    if (/[xX]/.test(notation)) {
      suggestions.push(`Use 'E' for exploding dice instead of 'X'`)
      suggestions.push(`Example: '4d6E' to explode on maximum rolls`)
    }

    // Missing quantity
    if (notation.startsWith('d')) {
      suggestions.push(`Add a quantity before 'd': '1${notation}' or '2${notation}'`)
    }

    // Invalid characters
    if (/[^0-9dDhHlLrReE+\-{},]/.test(notation)) {
      suggestions.push('Remove invalid characters - only use numbers, d, H, L, R, E, +, -, and {} for custom faces')
    }

    // General format guidance
    if (suggestions.length === 0) {
      suggestions.push('Use format: <quantity>d<sides><modifiers>')
      suggestions.push('Examples: "4d6", "2d20H", "3d8L", "1d20+5"')
      suggestions.push('For custom dice: "2d{H,T}" for coin flips')
    }

    return suggestions
  }
}

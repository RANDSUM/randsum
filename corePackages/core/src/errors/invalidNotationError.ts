import { type ErrorContext, RandsumError } from './randsumError'

export class InvalidNotationError extends RandsumError {
  constructor(notation: string, reason?: string, suggestions?: string[]) {
    const message = `Invalid dice notation: ${reason ?? notation}`

    const context: ErrorContext = {
      input: notation,
      expected: 'Valid dice notation like "4d6", "2d20H", or "3d8+2"',
      location: 'notation parsing'
    }

    const autoSuggestions =
      suggestions ?? InvalidNotationError.generateSuggestions(notation)

    super(message, 'INVALID_NOTATION', context, autoSuggestions)
    this.name = 'InvalidNotationError'
  }

  private static generateSuggestions(notation: string): string[] {
    const suggestions: string[] = []

    if (notation.includes('l')) {
      suggestions.push(
        `Did you mean '${notation.replace(/l/g, 'L')}' to drop the lowest roll?`
      )
    }
    if (notation.includes('h')) {
      suggestions.push(
        `Did you mean '${notation.replace(/h/g, 'H')}' to keep the highest roll?`
      )
    }

    if (/^\d{2,}/.test(notation)) {
      const digits = /^\d+/.exec(notation)?.[0] ?? ''
      if (digits.length >= 2) {
        const quantity = digits.slice(0, -1)
        const remainder = notation.slice(quantity.length)
        suggestions.push(`Did you mean '${quantity}d${remainder}'?`)
      }
    }

    if (/[xX]/.test(notation)) {
      suggestions.push(`Use 'E' for exploding dice instead of 'X'`)
      suggestions.push(`Example: '4d6E' to explode on maximum rolls`)
    }

    if (notation.startsWith('d')) {
      suggestions.push(
        `Add a quantity before 'd': '1${notation}' or '2${notation}'`
      )
    }

    if (/[^0-9dDhHlLrReE+\-{},]/.test(notation)) {
      suggestions.push(
        'Remove invalid characters - only use numbers, d, H, L, R, E, +, -, and {} for custom faces'
      )
    }

    if (suggestions.length === 0) {
      suggestions.push('Use format: <quantity>d<sides><modifiers>')
      suggestions.push('Examples: "4d6", "2d20H", "3d8L", "1d20+5"')
      suggestions.push('For custom dice: "2d{H,T}" for coin flips')
    }

    return suggestions
  }
}

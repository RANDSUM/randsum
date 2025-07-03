import { describe, expect, test } from 'bun:test'
import { InvalidNotationError, RandsumError } from '../../../src/lib'

describe('InvalidNotationError', () => {
  describe('constructor', () => {
    test('creates error with notation only', () => {
      const notation = '4d6x'
      const error = new InvalidNotationError(notation)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('InvalidNotationError')
      expect(error.code).toBe('INVALID_NOTATION')
      expect(error.message).toBe('Invalid dice notation: 4d6x')
      expect(error.context.input).toBe(notation)
      expect(error.context.expected).toBe(
        'Valid dice notation like "4d6", "2d20H", or "3d8+2"'
      )
      expect(error.context.location).toBe('notation parsing')
    })

    test('creates error with notation and reason', () => {
      const notation = '4d6x'
      const reason = 'Invalid modifier "x"'
      const error = new InvalidNotationError(notation, reason)

      expect(error.message).toBe('Invalid dice notation: Invalid modifier "x"')
      expect(error.context.input).toBe(notation)
    })

    test('creates error with custom suggestions', () => {
      const notation = '4d6x'
      const reason = 'Invalid modifier'
      const suggestions = ['Use "E" for exploding dice', 'Try "4d6E" instead']
      const error = new InvalidNotationError(notation, reason, suggestions)

      expect(error.suggestions).toEqual(suggestions)
      expect(error.message).toBe('Invalid dice notation: Invalid modifier')
    })

    test('uses auto-generated suggestions when none provided', () => {
      const notation = '4d6x'
      const error = new InvalidNotationError(notation)

      expect(error.suggestions.length).toBeGreaterThan(0)
      expect(error.suggestions).toContain(
        `Use 'E' for exploding dice instead of 'X'`
      )
    })
  })

  describe('generateSuggestions', () => {
    test('suggests uppercase L for lowercase l', () => {
      const error = new InvalidNotationError('4d6l')

      expect(error.suggestions).toContain(
        `Did you mean '4d6L' to drop the lowest roll?`
      )
    })

    test('suggests uppercase H for lowercase h', () => {
      const error = new InvalidNotationError('4d6h')

      expect(error.suggestions).toContain(
        `Did you mean '4d6H' to keep the highest roll?`
      )
    })

    test('suggests both L and H corrections', () => {
      const error = new InvalidNotationError('4d6lh')

      expect(error.suggestions).toContain(
        `Did you mean '4d6Lh' to drop the lowest roll?`
      )
      expect(error.suggestions).toContain(
        `Did you mean '4d6lH' to keep the highest roll?`
      )
    })

    test('suggests adding d separator for missing d', () => {
      const error = new InvalidNotationError('46')

      expect(error.suggestions).toContain(`Did you mean '4d6'?`)
    })

    test('suggests adding d separator for complex notation', () => {
      const error = new InvalidNotationError('420+5')

      expect(error.suggestions).toContain(`Did you mean '42d0+5'?`)
    })

    test('suggests E instead of X for exploding dice', () => {
      const error = new InvalidNotationError('4d6x')

      expect(error.suggestions).toContain(
        `Use 'E' for exploding dice instead of 'X'`
      )
      expect(error.suggestions).toContain(
        `Example: '4d6E' to explode on maximum rolls`
      )
    })

    test('suggests E instead of uppercase X', () => {
      const error = new InvalidNotationError('4d6X')

      expect(error.suggestions).toContain(
        `Use 'E' for exploding dice instead of 'X'`
      )
    })

    test('suggests adding quantity for missing quantity', () => {
      const error = new InvalidNotationError('d6')

      expect(error.suggestions).toContain(
        `Add a quantity before 'd': '1d6' or '2d6'`
      )
    })

    test('suggests adding quantity for complex notation', () => {
      const error = new InvalidNotationError('d20+5')

      expect(error.suggestions).toContain(
        `Add a quantity before 'd': '1d20+5' or '2d20+5'`
      )
    })

    test('suggests removing invalid characters', () => {
      const error = new InvalidNotationError('4d6@#$')

      expect(error.suggestions).toContain(
        'Remove invalid characters - only use numbers, d, H, L, R, E, +, -, and {} for custom faces'
      )
    })

    test('provides general format guidance when no specific suggestions', () => {
      const error = new InvalidNotationError('')

      expect(error.suggestions).toContain(
        'Use format: <quantity>d<sides><modifiers>'
      )
      expect(error.suggestions).toContain(
        'Examples: "4d6", "2d20H", "3d8L", "1d20+5"'
      )
      expect(error.suggestions).toContain(
        'For custom dice: "2d{H,T}" for coin flips'
      )
    })

    test('does not provide general guidance when specific suggestions exist', () => {
      const error = new InvalidNotationError('4d6x')

      expect(error.suggestions).not.toContain(
        'Use format: <quantity>d<sides><modifiers>'
      )
    })

    test('handles multiple suggestion categories', () => {
      const error = new InvalidNotationError('d6lx@')

      expect(error.suggestions.length).toBeGreaterThan(3)
      expect(error.suggestions.some((s) => s.includes('quantity'))).toBe(true)
      expect(error.suggestions.some((s) => s.includes('L'))).toBe(true)
      expect(error.suggestions.some((s) => s.includes('exploding'))).toBe(true)
      expect(
        error.suggestions.some((s) => s.includes('invalid characters'))
      ).toBe(true)
    })

    test('handles empty notation', () => {
      const error = new InvalidNotationError('')

      expect(error.suggestions).toContain(
        'Use format: <quantity>d<sides><modifiers>'
      )
    })

    test('handles notation with only valid characters but wrong format', () => {
      const error = new InvalidNotationError('6d4d2')

      expect(error.suggestions).toContain(
        'Use format: <quantity>d<sides><modifiers>'
      )
    })
  })

  describe('error inheritance', () => {
    test('maintains proper prototype chain', () => {
      const error = new InvalidNotationError('4d6x')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)

      expect(error.name).toBe('InvalidNotationError')
    })

    test('has correct error properties', () => {
      const error = new InvalidNotationError('4d6x')

      expect(error.name).toBe('InvalidNotationError')
      expect(error.code).toBe('INVALID_NOTATION')
      expect(typeof error.message).toBe('string')
      expect(error.context).toBeDefined()
      expect(Array.isArray(error.suggestions)).toBe(true)
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('edge cases', () => {
    test('handles very long notation strings', () => {
      const longNotation = 'a'.repeat(1000) + 'd6'
      const error = new InvalidNotationError(longNotation)

      expect(error.context.input).toBe(longNotation)
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('handles notation with unicode characters', () => {
      const unicodeNotation = '4d6αβγ'
      const error = new InvalidNotationError(unicodeNotation)

      expect(error.suggestions).toContain(
        'Remove invalid characters - only use numbers, d, H, L, R, E, +, -, and {} for custom faces'
      )
    })

    test('handles notation with only numbers', () => {
      const error = new InvalidNotationError('123456')

      expect(error.suggestions).toContain(`Did you mean '12345d6'?`)
    })
  })
})

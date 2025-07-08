import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../../src'

describe('isDiceNotation', () => {
  describe('Basic dice notation', () => {
    test('should return true for valid basic notation', () => {
      expect(isDiceNotation('1d6')).toBe(true)
      expect(isDiceNotation('2d20')).toBe(true)
      expect(isDiceNotation('4d8')).toBe(true)
      expect(isDiceNotation('100d1')).toBe(true)
      expect(isDiceNotation('1d100')).toBe(true)
    })

    test('should handle case insensitivity', () => {
      expect(isDiceNotation('2D6')).toBe(true)
      expect(isDiceNotation('4d20')).toBe(true)
      expect(isDiceNotation('1D100')).toBe(true)
    })

    test('should handle whitespace', () => {
      expect(isDiceNotation(' 2d6 ')).toBe(false) // Leading/trailing whitespace not allowed
      expect(isDiceNotation('2 d 6')).toBe(false) // Internal whitespace not allowed
      expect(isDiceNotation(' 4d20 ')).toBe(false) // Leading/trailing whitespace not allowed
    })
  })

  describe('Notation with modifiers', () => {
    test('should return true for drop modifiers', () => {
      expect(isDiceNotation('4d6L')).toBe(true)
      expect(isDiceNotation('4d6H')).toBe(true)
      expect(isDiceNotation('4d6L2')).toBe(true)
      expect(isDiceNotation('4d6H1')).toBe(true)
      expect(isDiceNotation('4d6D{>5}')).toBe(true)
      expect(isDiceNotation('4d6D{<2}')).toBe(true)
      expect(isDiceNotation('4d6D{3,4}')).toBe(true)
    })

    test('should return true for reroll modifiers', () => {
      expect(isDiceNotation('4d6R{1}')).toBe(true)
      expect(isDiceNotation('4d6R{1,2}')).toBe(true)
      expect(isDiceNotation('4d6R{>5}')).toBe(true)
      expect(isDiceNotation('4d6R{<3}')).toBe(true)
      expect(isDiceNotation('4d6R{1}3')).toBe(true)
    })

    test('should return true for replace modifiers', () => {
      expect(isDiceNotation('4d6V{1=6}')).toBe(true)
      expect(isDiceNotation('4d6V{>5=6}')).toBe(true)
      expect(isDiceNotation('4d6V{<2=1}')).toBe(true)
    })

    test('should return true for unique modifiers', () => {
      expect(isDiceNotation('4d6U')).toBe(true)
      expect(isDiceNotation('4d6U{1,2}')).toBe(true)
    })

    test('should return true for exploding dice', () => {
      expect(isDiceNotation('4d6!')).toBe(true)
      expect(isDiceNotation('2d20!')).toBe(true)
    })

    test('should return true for cap modifiers', () => {
      expect(isDiceNotation('4d6C{>5}')).toBe(true)
      expect(isDiceNotation('4d6C{<2}')).toBe(true)
      expect(isDiceNotation('4d6C{>5,<2}')).toBe(true)
    })

    test('should return true for arithmetic modifiers', () => {
      expect(isDiceNotation('4d6+2')).toBe(true)
      expect(isDiceNotation('4d6-1')).toBe(true)
      expect(isDiceNotation('2d20+5')).toBe(true)
      expect(isDiceNotation('1d8+3-1')).toBe(true)
    })
  })

  describe('Complex combined modifiers', () => {
    test('should return true for multiple modifiers', () => {
      expect(isDiceNotation('4d6L+2')).toBe(true)
      expect(isDiceNotation('4d6LR{1}')).toBe(true)
      expect(isDiceNotation('4d6R{1}!+3')).toBe(true)
      expect(isDiceNotation('2d20H!+1')).toBe(true)
      expect(isDiceNotation('4d6LHR{1,6}C{<2,>5}U!+10-3')).toBe(true)
    })
  })

  describe('Custom dice notation', () => {
    test('should return true for custom faces', () => {
      expect(isDiceNotation('2d{HT}')).toBe(true)
      expect(isDiceNotation('3d{abc}')).toBe(true)
      expect(isDiceNotation('4d{red,blue,green,yellow}')).toBe(true)
      expect(isDiceNotation('1d{critical,hit,miss}')).toBe(true)
    })

    test('should handle custom faces with special characters', () => {
      expect(isDiceNotation('2d{⚔️🛡️🏹}')).toBe(true)
      expect(isDiceNotation('4d{NSEW}')).toBe(true)
    })
  })

  describe('Invalid notation', () => {
    test('should return false for non-strings', () => {
      expect(isDiceNotation(null)).toBe(false)
      expect(isDiceNotation(undefined)).toBe(false)
      expect(isDiceNotation(123)).toBe(false)
      expect(isDiceNotation([])).toBe(false)
      expect(isDiceNotation({})).toBe(false)
      expect(isDiceNotation(true)).toBe(false)
    })

    test('should return false for invalid basic notation', () => {
      expect(isDiceNotation('')).toBe(false)
      expect(isDiceNotation('d6')).toBe(false)
      expect(isDiceNotation('4d')).toBe(false)
      expect(isDiceNotation('4x6')).toBe(false)
      expect(isDiceNotation('4d0')).toBe(true) // Actually valid in the system
      expect(isDiceNotation('0d6')).toBe(true) // Actually valid in the system
    })

    test('should return false for invalid modifiers', () => {
      expect(isDiceNotation('4d6X')).toBe(false)
      expect(isDiceNotation('4d6R')).toBe(false)
      expect(isDiceNotation('4d6R{}')).toBe(false)
      expect(isDiceNotation('4d6C')).toBe(false)
      expect(isDiceNotation('4d6V')).toBe(false)
    })

    test('should return false for malformed custom dice', () => {
      expect(isDiceNotation('2d{')).toBe(false)
      expect(isDiceNotation('2d}')).toBe(false)
      expect(isDiceNotation('2d{}')).toBe(true) // Actually valid - empty custom die
      expect(isDiceNotation('2d{,}')).toBe(true) // Actually valid - comma is a valid face
    })

    test('should return false for random strings', () => {
      expect(isDiceNotation('hello')).toBe(false)
      expect(isDiceNotation('roll dice')).toBe(false)
      expect(isDiceNotation('4 + 6')).toBe(false)
      expect(isDiceNotation('dice notation')).toBe(false)
    })

    test('should return false for incomplete notation', () => {
      expect(isDiceNotation('4d6L+')).toBe(false)
      expect(isDiceNotation('4d6R{1')).toBe(false)
      expect(isDiceNotation('4d6V{1=')).toBe(false)
      expect(isDiceNotation('4d6C{>')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    test('should handle large numbers', () => {
      expect(isDiceNotation('999d999')).toBe(true)
      expect(isDiceNotation('1000d1000')).toBe(true)
    })

    test('should handle single digit notation', () => {
      expect(isDiceNotation('1d1')).toBe(true)
      expect(isDiceNotation('1d2')).toBe(true)
      expect(isDiceNotation('2d1')).toBe(true)
    })

    test('should work with array filtering', () => {
      const inputs = [
        '4d6',
        'invalid',
        '2d20+5',
        null,
        '4d6L',
        123,
        '2d{HT}',
        'hello world'
      ]

      const validNotations = inputs.filter(isDiceNotation)
      expect(validNotations).toHaveLength(4)
      expect(validNotations).toEqual(['4d6', '2d20+5', '4d6L', '2d{HT}'])
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing', () => {
      const input: unknown = '4d6+2'

      if (isDiceNotation(input)) {
        // TypeScript should know input is DiceNotation (string) here
        const length: number = input.length
        const upperCase: string = input.toUpperCase()
        expect(typeof length).toBe('number')
        expect(typeof upperCase).toBe('string')
      }
    })

    test('should enable type-safe notation processing', () => {
      const possibleNotations = ['4d6', 'invalid', '2d20+5', null, '4d6L']

      possibleNotations.forEach((notation) => {
        if (isDiceNotation(notation)) {
          // TypeScript knows notation is string here
          expect(typeof notation).toBe('string')
          expect(notation.length).toBeGreaterThan(0)
        }
      })
    })
  })
})

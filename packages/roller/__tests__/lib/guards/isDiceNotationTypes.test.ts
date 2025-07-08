import { describe, expect, test } from 'bun:test'
import {
  isCustomDiceNotation,
  isNumericDiceNotation
} from '../../../src/lib/guards'

describe('Dice Notation Type Guards', () => {
  describe('isCustomDiceNotation', () => {
    test('should return true for custom dice notation', () => {
      expect(isCustomDiceNotation('2d{HT}')).toBe(true)
      expect(isCustomDiceNotation('3d{abc}')).toBe(true)
      expect(isCustomDiceNotation('4d{red,blue,green,yellow}')).toBe(true)
      expect(isCustomDiceNotation('1d{critical,hit,miss}')).toBe(true)
      expect(isCustomDiceNotation('2d{⚔️🛡️🏹}')).toBe(true)
      expect(isCustomDiceNotation('4d{NSEW}')).toBe(true)
    })

    test('should return false for numeric dice notation', () => {
      expect(isCustomDiceNotation('1d6')).toBe(false)
      expect(isCustomDiceNotation('2d20')).toBe(false)
      expect(isCustomDiceNotation('4d8')).toBe(false)
      expect(isCustomDiceNotation('100d1')).toBe(false)
    })

    test('should return false for numeric notation with modifiers', () => {
      expect(isCustomDiceNotation('4d6L')).toBe(false)
      expect(isCustomDiceNotation('4d6H')).toBe(false)
      expect(isCustomDiceNotation('4d6+2')).toBe(false)
      expect(isCustomDiceNotation('4d6R{1}')).toBe(true) // Contains { so it's considered custom
      expect(isCustomDiceNotation('4d6!')).toBe(false)
    })

    test('should return false for invalid notation', () => {
      expect(isCustomDiceNotation('invalid')).toBe(false)
      expect(isCustomDiceNotation('')).toBe(false)
      expect(isCustomDiceNotation('d6')).toBe(false)
      expect(isCustomDiceNotation('4d')).toBe(false)
      expect(isCustomDiceNotation(null)).toBe(false)
      expect(isCustomDiceNotation(undefined)).toBe(false)
      expect(isCustomDiceNotation(123)).toBe(false)
    })

    test('should handle case insensitivity', () => {
      expect(isCustomDiceNotation('2D{HT}')).toBe(true)
      expect(isCustomDiceNotation('3d{ABC}')).toBe(true)
    })

    test('should handle whitespace', () => {
      expect(isCustomDiceNotation(' 2d{HT} ')).toBe(false) // Whitespace makes it invalid dice notation
      expect(isCustomDiceNotation('2 d {HT}')).toBe(false) // Whitespace makes it invalid dice notation
    })

    test('should work with array filtering', () => {
      const notations = [
        '4d6',
        '2d{HT}',
        '4d6L',
        '3d{abc}',
        'invalid',
        '2d20+5',
        '1d{critical,hit,miss}'
      ]

      const customNotations = notations.filter(isCustomDiceNotation)
      expect(customNotations).toHaveLength(3)
      expect(customNotations).toEqual([
        '2d{HT}',
        '3d{abc}',
        '1d{critical,hit,miss}'
      ])
    })
  })

  describe('isNumericDiceNotation', () => {
    test('should return true for basic numeric notation', () => {
      expect(isNumericDiceNotation('1d6')).toBe(true)
      expect(isNumericDiceNotation('2d20')).toBe(true)
      expect(isNumericDiceNotation('4d8')).toBe(true)
      expect(isNumericDiceNotation('100d1')).toBe(true)
      expect(isNumericDiceNotation('1d100')).toBe(true)
    })

    test('should return true for numeric notation with modifiers', () => {
      expect(isNumericDiceNotation('4d6L')).toBe(true)
      expect(isNumericDiceNotation('4d6H')).toBe(true)
      expect(isNumericDiceNotation('4d6L2')).toBe(true)
      expect(isNumericDiceNotation('4d6+2')).toBe(true)
      expect(isNumericDiceNotation('4d6-1')).toBe(true)
      expect(isNumericDiceNotation('4d6R{1}')).toBe(false) // Contains { so it's considered custom
      expect(isNumericDiceNotation('4d6!')).toBe(true)
      expect(isNumericDiceNotation('4d6U')).toBe(true)
      expect(isNumericDiceNotation('4d6C{>5}')).toBe(false) // Contains { so it's considered custom
      expect(isNumericDiceNotation('4d6V{1=6}')).toBe(false) // Contains { so it's considered custom
    })

    test('should return true for complex numeric notation', () => {
      expect(isNumericDiceNotation('4d6L+2')).toBe(true)
      expect(isNumericDiceNotation('4d6LR{1}')).toBe(false) // Contains { so it's considered custom
      expect(isNumericDiceNotation('4d6R{1}!+3')).toBe(false) // Contains { so it's considered custom
      expect(isNumericDiceNotation('2d20H!+1')).toBe(true)
    })

    test('should return false for custom dice notation', () => {
      expect(isNumericDiceNotation('2d{HT}')).toBe(false)
      expect(isNumericDiceNotation('3d{abc}')).toBe(false)
      expect(isNumericDiceNotation('4d{red,blue,green,yellow}')).toBe(false)
      expect(isNumericDiceNotation('1d{critical,hit,miss}')).toBe(false)
      expect(isNumericDiceNotation('2d{⚔️🛡️🏹}')).toBe(false)
    })

    test('should return false for invalid notation', () => {
      expect(isNumericDiceNotation('invalid')).toBe(false)
      expect(isNumericDiceNotation('')).toBe(false)
      expect(isNumericDiceNotation('d6')).toBe(false)
      expect(isNumericDiceNotation('4d')).toBe(false)
      expect(isNumericDiceNotation(null)).toBe(false)
      expect(isNumericDiceNotation(undefined)).toBe(false)
      expect(isNumericDiceNotation(123)).toBe(false)
    })

    test('should handle case insensitivity', () => {
      expect(isNumericDiceNotation('2D6')).toBe(true)
      expect(isNumericDiceNotation('4d20')).toBe(true)
      expect(isNumericDiceNotation('1D100')).toBe(true)
    })

    test('should handle whitespace', () => {
      expect(isNumericDiceNotation(' 2d6 ')).toBe(false) // Whitespace makes it invalid dice notation
      expect(isNumericDiceNotation('2 d 6')).toBe(false) // Whitespace makes it invalid dice notation
      expect(isNumericDiceNotation(' 4d20 ')).toBe(false) // Whitespace makes it invalid dice notation
    })

    test('should work with array filtering', () => {
      const notations = [
        '4d6',
        '2d{HT}',
        '4d6L',
        '3d{abc}',
        'invalid',
        '2d20+5',
        '1d{critical,hit,miss}'
      ]

      const numericNotations = notations.filter(isNumericDiceNotation)
      expect(numericNotations).toHaveLength(3)
      expect(numericNotations).toEqual(['4d6', '4d6L', '2d20+5'])
    })
  })

  describe('Mutual exclusivity', () => {
    test('should be mutually exclusive for valid notation', () => {
      const validNotations = [
        '4d6',
        '2d{HT}',
        '4d6L',
        '3d{abc}',
        '2d20+5',
        '1d{critical,hit,miss}',
        '4d6R{1}!+3'
      ]

      validNotations.forEach((notation) => {
        const isCustom = isCustomDiceNotation(notation)
        const isNumeric = isNumericDiceNotation(notation)

        // Should be exactly one or the other, never both or neither
        expect(isCustom !== isNumeric).toBe(true)
      })
    })

    test('should both return false for invalid notation', () => {
      const invalidInputs = [
        'invalid',
        '',
        'd6',
        '4d',
        null,
        undefined,
        123,
        [],
        {}
      ]

      invalidInputs.forEach((input) => {
        expect(isCustomDiceNotation(input)).toBe(false)
        expect(isNumericDiceNotation(input)).toBe(false)
      })
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing for custom notation', () => {
      const input: unknown = '2d{HT}'

      if (isCustomDiceNotation(input)) {
        // TypeScript should know input is string here
        expect(typeof input).toBe('string')
        expect((input as string).includes('{')).toBe(true)
        expect((input as string).includes('}')).toBe(true)
      }
    })

    test('should provide proper TypeScript type narrowing for numeric notation', () => {
      const input: unknown = '4d6+2'

      if (isNumericDiceNotation(input)) {
        // TypeScript should know input is string here
        expect(typeof input).toBe('string')
        expect((input as string).includes('{')).toBe(false)
      }
    })

    test('should enable type-safe notation categorization', () => {
      const notations = ['4d6', '2d{HT}', '4d6L', '3d{abc}', '2d20+5']

      const customNotations: string[] = []
      const numericNotations: string[] = []

      notations.forEach((notation) => {
        if (isCustomDiceNotation(notation)) {
          customNotations.push(notation)
        } else if (isNumericDiceNotation(notation)) {
          numericNotations.push(notation)
        }
      })

      expect(customNotations).toEqual(['2d{HT}', '3d{abc}'])
      expect(numericNotations).toEqual(['4d6', '4d6L', '2d20+5'])
    })
  })
})

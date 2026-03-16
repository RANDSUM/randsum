import { describe, expect, test } from 'bun:test'
import { parseModifiers } from '../../src/notation/parse/parseModifiers'
import { isDiceNotation } from '../../src/notation/isDiceNotation'

describe('Margin of Success (ms{N})', () => {
  describe('parseModifiers', () => {
    test('parses ms{15} as minus: 15', () => {
      expect(parseModifiers('1d20ms{15}')).toEqual({ minus: 15 })
    })

    test('parses MS{10} (uppercase) as minus: 10', () => {
      expect(parseModifiers('1d20MS{10}')).toEqual({ minus: 10 })
    })

    test('parses Ms{5} (mixed case) as minus: 5', () => {
      expect(parseModifiers('1d20Ms{5}')).toEqual({ minus: 5 })
    })

    test('parses mS{20} (mixed case) as minus: 20', () => {
      expect(parseModifiers('1d20mS{20}')).toEqual({ minus: 20 })
    })

    test('combines with other modifiers', () => {
      const result = parseModifiers('4d6Lms{10}')
      expect(result.minus).toBe(10)
    })

    test('ms{N} and -N accumulate', () => {
      // ms{10} becomes -10, plus explicit -5 = -15 total
      const result = parseModifiers('1d20ms{10}-5')
      expect(result.minus).toBe(15)
    })
  })

  describe('isDiceNotation', () => {
    test('1d20ms{15} is valid notation', () => {
      expect(isDiceNotation('1d20ms{15}')).toBe(true)
    })

    test('1d20MS{10} is valid notation', () => {
      expect(isDiceNotation('1d20MS{10}')).toBe(true)
    })

    test('4d6Lms{12} is valid notation', () => {
      expect(isDiceNotation('4d6Lms{12}')).toBe(true)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../src/isDiceNotation'

describe('isDiceNotation', () => {
  describe('valid dice notation strings', () => {
    test('returns true for basic dice notation', () => {
      expect(isDiceNotation('1d6')).toBe(true)
      expect(isDiceNotation('2d8')).toBe(true)
      expect(isDiceNotation('4d20')).toBe(true)
      expect(isDiceNotation('100d100')).toBe(true)
    })

    test('returns true for multi dice notation', () => {
      expect(isDiceNotation('1d20+2d6-1d8')).toBe(true)
    })

    test('returns true for plus and negatived dice notation', () => {
      expect(isDiceNotation('+1d6')).toBe(true)
      expect(isDiceNotation('-1d6')).toBe(true)
    })

    test('returns true for uppercase D notation', () => {
      expect(isDiceNotation('1D6')).toBe(true)
      expect(isDiceNotation('2D8')).toBe(true)
      expect(isDiceNotation('4D20')).toBe(true)
    })

    test('returns true for dice notation with modifiers', () => {
      expect(isDiceNotation('4d6L')).toBe(true)
      expect(isDiceNotation('2d20H')).toBe(true)
      expect(isDiceNotation('3d6!')).toBe(true)
      expect(isDiceNotation('4d6+3')).toBe(true)
      expect(isDiceNotation('2d8-1')).toBe(true)
    })

    test('returns true for complex dice notation', () => {
      expect(isDiceNotation('4d6L+3')).toBe(true)
      expect(isDiceNotation('2d20H-2')).toBe(true)
      expect(isDiceNotation('3d6!+5')).toBe(true)
      expect(isDiceNotation('4d6LR{1}+3')).toBe(true)
    })

    test('returns true for dice notation with reroll modifiers', () => {
      expect(isDiceNotation('4d6R{1}')).toBe(true)
      expect(isDiceNotation('2d20R{1,2}')).toBe(true)
      expect(isDiceNotation('3d8R{<3}')).toBe(true)
      expect(isDiceNotation('4d10R{>8}')).toBe(true)
    })

    test('returns true for dice notation with cap modifiers', () => {
      expect(isDiceNotation('4d20C{>18}')).toBe(true)
      expect(isDiceNotation('3d6C{<2}')).toBe(true)
      expect(isDiceNotation('2d8C{>6,<2}')).toBe(true)
    })

    test('returns true for dice notation with unique modifiers', () => {
      expect(isDiceNotation('4d20U')).toBe(true)
      expect(isDiceNotation('5d6U{1,6}')).toBe(true)
    })

    test('returns true for dice notation with replace modifiers', () => {
      expect(isDiceNotation('4d6V{1=2}')).toBe(true)
      expect(isDiceNotation('3d8V{>6=6}')).toBe(true)
      expect(isDiceNotation('2d10V{1=2,2=3}')).toBe(true)
    })

    test('returns true for dice notation with internal whitespace', () => {
      expect(isDiceNotation('2d8 + 3')).toBe(true)
      expect(isDiceNotation('4d6L + 2')).toBe(true)
      expect(isDiceNotation('3d6 ! + 5')).toBe(true)
    })

    test('returns true for dice notation with leading/trailing whitespace', () => {
      expect(isDiceNotation(' 1d6')).toBe(true)
      expect(isDiceNotation('1d6 ')).toBe(true)
      expect(isDiceNotation(' 1d6 ')).toBe(true)
      expect(isDiceNotation('\t2d8\t')).toBe(true)
      expect(isDiceNotation('\n4d6\n')).toBe(true)
    })

    test('returns true for edge case dice values', () => {
      expect(isDiceNotation('0d6')).toBe(true)
      expect(isDiceNotation('1d0')).toBe(true)
      expect(isDiceNotation('999d999')).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isDiceNotation(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isDiceNotation(undefined)).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(isDiceNotation(42)).toBe(false)
      expect(isDiceNotation(0)).toBe(false)
      expect(isDiceNotation(-1)).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isDiceNotation(true)).toBe(false)
      expect(isDiceNotation(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isDiceNotation([])).toBe(false)
      expect(isDiceNotation([1, 2, 3])).toBe(false)
      expect(isDiceNotation(['1d6'])).toBe(false)
    })

    test('returns false for objects', () => {
      expect(isDiceNotation({})).toBe(false)
      expect(isDiceNotation({ sides: 6 })).toBe(false)
    })

    test('returns false for functions', () => {
      expect(
        isDiceNotation(() => {
          // noop
        })
      ).toBe(false)
      expect(
        isDiceNotation(() => {
          // noop
        })
      ).toBe(false)
    })
  })

  describe('invalid string formats', () => {
    test('returns false for empty string', () => {
      expect(isDiceNotation('')).toBe(false)
    })

    test('returns false for strings without dice notation', () => {
      expect(isDiceNotation('hello')).toBe(false)
      expect(isDiceNotation('abc')).toBe(false)
      expect(isDiceNotation('123')).toBe(false)
    })

    test('returns false for incomplete dice notation', () => {
      expect(isDiceNotation('d6')).toBe(false)
      expect(isDiceNotation('2d')).toBe(false)
      expect(isDiceNotation('1')).toBe(false)
      expect(isDiceNotation('d')).toBe(false)
    })

    test('returns false for invalid dice separators', () => {
      expect(isDiceNotation('2x6')).toBe(false)
      expect(isDiceNotation('2*6')).toBe(false)
      expect(isDiceNotation('2/6')).toBe(false)
      expect(isDiceNotation('2-6')).toBe(false)
    })

    test('returns false for malformed dice notation', () => {
      expect(isDiceNotation('dd6')).toBe(false)
      expect(isDiceNotation('2dd6')).toBe(false)
      expect(isDiceNotation('2d6d')).toBe(false)
      expect(isDiceNotation('1d{6}')).toBe(false)
      expect(isDiceNotation('1d}')).toBe(false)
    })

    test('returns false for notation with invalid characters', () => {
      expect(isDiceNotation('1d6@')).toBe(false)
      expect(isDiceNotation('1d6#')).toBe(false)
      expect(isDiceNotation('1d6$')).toBe(false)
      expect(isDiceNotation('1d6%')).toBe(false)
    })

    test('returns false for strings that contain valid notation but have extra content', () => {
      expect(isDiceNotation('roll 1d6')).toBe(false)
      expect(isDiceNotation('1d6 damage')).toBe(false)
      expect(isDiceNotation('prefix1d6')).toBe(false)
      expect(isDiceNotation('1d6suffix')).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns false for Date objects', () => {
      expect(isDiceNotation(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isDiceNotation(/1d6/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isDiceNotation(new Error('1d6'))).toBe(false)
    })

    test('returns false for Map objects', () => {
      expect(isDiceNotation(new Map())).toBe(false)
    })

    test('returns false for Set objects', () => {
      expect(isDiceNotation(new Set())).toBe(false)
    })

    test('returns false for strings with only whitespace', () => {
      expect(isDiceNotation('   ')).toBe(false)
      expect(isDiceNotation('\t')).toBe(false)
      expect(isDiceNotation('\n')).toBe(false)
    })

    test('returns true for very large numbers in notation', () => {
      expect(isDiceNotation('9999d9999')).toBe(true)
      expect(isDiceNotation('1000000d1000000')).toBe(true)
    })

    test('returns false for notation with decimal numbers', () => {
      expect(isDiceNotation('1.5d6')).toBe(false)
      expect(isDiceNotation('2d6.5')).toBe(false)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { isRollArgument } from '../../../src/lib/guards/isRollArgument'
import type { RollOptions } from '../../../src/types'

describe('isRollArgument', () => {
  describe('valid RollArgument values', () => {
    test('returns true for valid DiceNotation strings', () => {
      expect(isRollArgument('1d6')).toBe(true)
      expect(isRollArgument('2d8')).toBe(true)
      expect(isRollArgument('4d20')).toBe(true)
      expect(isRollArgument('4d6L+3')).toBe(true)
      expect(isRollArgument('2d20H')).toBe(true)
      expect(isRollArgument('3d6!')).toBe(true)
    })

    test('returns true for valid RollOptions objects', () => {
      const basicOptions: RollOptions = { sides: 6 }
      expect(isRollArgument(basicOptions)).toBe(true)

      const complexOptions: RollOptions = {
        sides: 20,
        quantity: 4,
        modifiers: {
          drop: { lowest: 1 },
          plus: 3
        }
      }
      expect(isRollArgument(complexOptions)).toBe(true)

      const optionsWithQuantity: RollOptions = {
        sides: 8,
        quantity: 2
      }
      expect(isRollArgument(optionsWithQuantity)).toBe(true)
    })

    test('returns true for number values', () => {
      expect(isRollArgument(6)).toBe(true)
      expect(isRollArgument(20)).toBe(true)
      expect(isRollArgument(100)).toBe(true)
      expect(isRollArgument(0)).toBe(true)
      expect(isRollArgument(-1)).toBe(true)
      expect(isRollArgument(1.5)).toBe(true)
    })

    test('returns true for numeric string values (template literals)', () => {
      expect(isRollArgument('6')).toBe(true)
      expect(isRollArgument('20')).toBe(true)
      expect(isRollArgument('100')).toBe(true)
      expect(isRollArgument('0')).toBe(true)
      expect(isRollArgument('-1')).toBe(true)
      expect(isRollArgument('1.5')).toBe(true)
      expect(isRollArgument('999')).toBe(true)
    })

    test('returns true for numeric strings with whitespace', () => {
      expect(isRollArgument(' 6 ')).toBe(true)
      expect(isRollArgument('\t20\t')).toBe(true)
      expect(isRollArgument('\n100\n')).toBe(true)
    })

    test('returns true for dice notation with whitespace', () => {
      expect(isRollArgument(' 1d6 ')).toBe(true)
      expect(isRollArgument('2d8 + 3')).toBe(true)
      expect(isRollArgument(' 4d6L + 2 ')).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isRollArgument(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isRollArgument(undefined)).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isRollArgument(true)).toBe(false)
      expect(isRollArgument(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isRollArgument([])).toBe(false)
      expect(isRollArgument([1, 2, 3])).toBe(false)
      expect(isRollArgument(['1d6'])).toBe(false)
    })

    test('returns false for functions', () => {
      expect(
        isRollArgument(() => {
          // noop
        })
      ).toBe(false)
      expect(
        isRollArgument(() => {
          // noop
        })
      ).toBe(false)
    })
  })

  describe('invalid string values', () => {
    test('returns true for empty string (converts to 0)', () => {
      expect(isRollArgument('')).toBe(true)
    })

    test('returns false for non-numeric, non-dice notation strings', () => {
      expect(isRollArgument('hello')).toBe(false)
      expect(isRollArgument('abc')).toBe(false)
      expect(isRollArgument('test')).toBe(false)
      expect(isRollArgument('roll')).toBe(false)
    })

    test('returns false for strings that contain numbers but are not pure numbers', () => {
      expect(isRollArgument('6 sides')).toBe(false)
      expect(isRollArgument('roll 20')).toBe(false)
      expect(isRollArgument('20 damage')).toBe(false)
      expect(isRollArgument('a6')).toBe(false)
      expect(isRollArgument('6b')).toBe(false)
    })

    test('returns false for invalid dice notation', () => {
      expect(isRollArgument('d6')).toBe(false)
      expect(isRollArgument('2d')).toBe(false)
      expect(isRollArgument('dd6')).toBe(false)
      expect(isRollArgument('2x6')).toBe(false)
    })

    test('returns true for strings with only whitespace (convert to 0)', () => {
      expect(isRollArgument('   ')).toBe(true)
      expect(isRollArgument('\t')).toBe(true)
      expect(isRollArgument('\n')).toBe(true)
    })
  })

  describe('invalid object values', () => {
    test('returns false for empty objects', () => {
      expect(isRollArgument({})).toBe(false)
    })

    test('returns false for objects missing required RollOptions properties', () => {
      const missingSides = {
        quantity: 2,
        modifiers: { plus: 1 }
      }
      expect(isRollArgument(missingSides)).toBe(false)
    })

    test('returns false for objects with invalid RollOptions structure', () => {
      const invalidSides = {
        sides: 'six', // should be number
        quantity: 1
      }
      expect(isRollArgument(invalidSides)).toBe(false)
    })

    test('returns false for Date objects', () => {
      expect(isRollArgument(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isRollArgument(/1d6/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isRollArgument(new Error('test'))).toBe(false)
    })

    test('returns false for Map objects', () => {
      expect(isRollArgument(new Map())).toBe(false)
    })

    test('returns false for Set objects', () => {
      expect(isRollArgument(new Set())).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns true for special numeric values', () => {
      expect(isRollArgument(Infinity)).toBe(true)
      expect(isRollArgument(-Infinity)).toBe(true)
      expect(isRollArgument(NaN)).toBe(true) // NaN is still a number type
    })

    test('returns true for string representations of special numeric values', () => {
      expect(isRollArgument('Infinity')).toBe(true)
      expect(isRollArgument('-Infinity')).toBe(true)
      expect(isRollArgument('NaN')).toBe(false) // NaN string converts to NaN, which fails !isNaN check
    })

    test('returns true for scientific notation strings', () => {
      expect(isRollArgument('1e5')).toBe(true)
      expect(isRollArgument('2.5e-3')).toBe(true)
      expect(isRollArgument('1E10')).toBe(true)
    })

    test('returns true for hexadecimal number strings', () => {
      expect(isRollArgument('0x10')).toBe(true)
      expect(isRollArgument('0xFF')).toBe(true)
    })

    test('returns true for octal number strings', () => {
      expect(isRollArgument('0o10')).toBe(true)
      expect(isRollArgument('0O77')).toBe(true)
    })

    test('returns true for binary number strings', () => {
      expect(isRollArgument('0b1010')).toBe(true)
      expect(isRollArgument('0B1111')).toBe(true)
    })

    test('returns true for objects with extra properties (still valid RollOptions)', () => {
      const mixedObject = {
        sides: 6,
        notation: '1d6' // Extra property doesn't invalidate RollOptions
      }
      expect(isRollArgument(mixedObject)).toBe(true)
    })

    test('returns true for very large numbers', () => {
      expect(isRollArgument(Number.MAX_SAFE_INTEGER)).toBe(true)
      expect(isRollArgument(Number.MIN_SAFE_INTEGER)).toBe(true)
      expect(isRollArgument('999999999999999')).toBe(true)
    })
  })
})

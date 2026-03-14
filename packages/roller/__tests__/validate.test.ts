import { describe, expect, test } from 'bun:test'
import {
  ValidationError,
  isDiceNotation,
  notation,
  validateFinite,
  validateInteger,
  validateNonNegative,
  validateNotation,
  validateRange
} from '../src/index'

describe('public validation re-exports', () => {
  describe('validateInteger', () => {
    test('passes for integers', () => {
      expect(() => {
        validateInteger(1, 'n')
      }).not.toThrow()
      expect(() => {
        validateInteger(0, 'n')
      }).not.toThrow()
      expect(() => {
        validateInteger(-3, 'n')
      }).not.toThrow()
    })

    test('throws for floats', () => {
      expect(() => {
        validateInteger(1.5, 'n')
      }).toThrow(ValidationError)
    })
  })

  describe('validateRange', () => {
    test('passes in range', () => {
      expect(() => {
        validateRange(5, 1, 10, 'v')
      }).not.toThrow()
    })

    test('throws out of range', () => {
      expect(() => {
        validateRange(0, 1, 10, 'v')
      }).toThrow(ValidationError)
      expect(() => {
        validateRange(11, 1, 10, 'v')
      }).toThrow(ValidationError)
    })
  })

  describe('validateNonNegative', () => {
    test('passes for 0+', () => {
      expect(() => {
        validateNonNegative(0, 'v')
      }).not.toThrow()
      expect(() => {
        validateNonNegative(5, 'v')
      }).not.toThrow()
    })

    test('throws for negatives', () => {
      expect(() => {
        validateNonNegative(-1, 'v')
      }).toThrow(ValidationError)
    })
  })

  describe('validateFinite', () => {
    test('passes for finite numbers', () => {
      expect(() => {
        validateFinite(42, 'v')
      }).not.toThrow()
    })

    test('throws for Infinity', () => {
      expect(() => {
        validateFinite(Infinity, 'v')
      }).toThrow(ValidationError)
    })

    test('throws for NaN', () => {
      expect(() => {
        validateFinite(NaN, 'v')
      }).toThrow(ValidationError)
    })
  })

  describe('notation utilities', () => {
    test('isDiceNotation is a callable function', () => {
      expect(typeof isDiceNotation).toBe('function')
      expect(isDiceNotation('2d6')).toBe(true)
      expect(isDiceNotation('not dice')).toBe(false)
    })

    test('notation is a callable function', () => {
      expect(typeof notation).toBe('function')
      expect(notation('2d6')).toBe('2d6')
    })

    test('validateNotation is a callable function', () => {
      expect(typeof validateNotation).toBe('function')
      const valid = validateNotation('2d6')
      expect(valid.valid).toBe(true)
      const invalid = validateNotation('zzz')
      expect(invalid.valid).toBe(false)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { isValidationResult } from '../../../src/lib/guards/isValidationResult'
import type {
  InvalidValidationResult,
  ValidValidationResult
} from '../../../src/types'

function createValidValidationResult(
  overrides: Partial<ValidValidationResult> = {}
): ValidValidationResult {
  return {
    valid: true,
    description: ['Roll 1d6'],
    options: { sides: 6, quantity: 1 },
    notation: '1d6',
    ...overrides
  }
}

function createInvalidValidationResult(
  overrides: Partial<InvalidValidationResult> = {}
): InvalidValidationResult {
  return {
    valid: false,
    description: ['Invalid notation'],
    options: {},
    ...overrides
  }
}

describe('isValidationResult', () => {
  describe('valid ValidationResult objects', () => {
    test('returns true for a complete ValidValidationResult', () => {
      const validResult = createValidValidationResult()
      expect(isValidationResult(validResult)).toBe(true)
    })

    test('returns true for a complete InvalidValidationResult', () => {
      const invalidResult = createInvalidValidationResult()
      expect(isValidationResult(invalidResult)).toBe(true)
    })

    test('returns true for ValidValidationResult with complex options options', () => {
      const complexResult = createValidValidationResult({
        options: {
          sides: 20,
          quantity: 4,
          modifiers: {
            drop: { lowest: 1 },
            plus: 3
          }
        },
        notation: '4d20L+3',
        description: ['Roll 4d20, drop lowest, add 3']
      })
      expect(isValidationResult(complexResult)).toBe(true)
    })

    test('returns true for InvalidValidationResult with detailed description', () => {
      const detailedInvalid = createInvalidValidationResult({
        description: [
          'Invalid notation: missing dice specification',
          'Expected format: NdS'
        ]
      })
      expect(isValidationResult(detailedInvalid)).toBe(true)
    })

    test('returns true for ValidationResult with empty description array', () => {
      const emptyDescription = createValidValidationResult({
        description: []
      })
      expect(isValidationResult(emptyDescription)).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isValidationResult(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isValidationResult(undefined)).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(isValidationResult(42)).toBe(false)
      expect(isValidationResult(0)).toBe(false)
      expect(isValidationResult(-1)).toBe(false)
    })

    test('returns false for strings', () => {
      expect(isValidationResult('')).toBe(false)
      expect(isValidationResult('valid')).toBe(false)
      expect(isValidationResult('{"valid": true}')).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isValidationResult(true)).toBe(false)
      expect(isValidationResult(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isValidationResult([])).toBe(false)
      expect(isValidationResult([1, 2, 3])).toBe(false)
    })

    test('returns false for functions', () => {
      expect(
        isValidationResult(() => {
          // noop
        })
      ).toBe(false)
      expect(
        isValidationResult(() => {
          // noop
        })
      ).toBe(false)
    })
  })

  describe('objects missing required properties', () => {
    test('returns false for empty object', () => {
      expect(isValidationResult({})).toBe(false)
    })

    test('returns false when missing valid property', () => {
      const missingValid = {
        description: ['Test'],
        options: { sides: 6 },
        notation: '1d6'
      }
      expect(isValidationResult(missingValid)).toBe(false)
    })

    test('returns false when missing description property', () => {
      const missingDescription = {
        valid: true,
        options: { sides: 6 },
        notation: '1d6'
      }
      expect(isValidationResult(missingDescription)).toBe(false)
    })

    test('returns false when missing options property', () => {
      const missingDigested = {
        valid: true,
        description: ['Test'],
        notation: '1d6'
      }
      expect(isValidationResult(missingDigested)).toBe(false)
    })

    test('returns false when ValidValidationResult missing notation property', () => {
      const missingNotation = {
        valid: true,
        description: ['Test'],
        options: { sides: 6 }
      }
      expect(isValidationResult(missingNotation)).toBe(false)
    })
  })

  describe('objects with properties of wrong types', () => {
    test('returns false when valid is not a boolean', () => {
      const wrongValidType = {
        valid: 'true',
        description: ['Test'],
        options: { sides: 6 },
        notation: '1d6'
      }
      expect(isValidationResult(wrongValidType)).toBe(false)
    })

    test('returns false when description is not an array', () => {
      const wrongDescriptionType = {
        valid: true,
        description: 'not an array',
        options: { sides: 6 },
        notation: '1d6'
      }
      expect(isValidationResult(wrongDescriptionType)).toBe(false)
    })

    test('returns false when options is not an object', () => {
      const wrongDigestedType = {
        valid: true,
        description: ['Test'],
        options: 'not an object',
        notation: '1d6'
      }
      expect(isValidationResult(wrongDigestedType)).toBe(false)
    })

    test('returns false when options is null', () => {
      const nullDigested = {
        valid: true,
        description: ['Test'],
        options: null,
        notation: '1d6'
      }
      expect(isValidationResult(nullDigested)).toBe(false)
    })

    test('returns false when notation is not a string (for valid results)', () => {
      const wrongNotationType = {
        valid: true,
        description: ['Test'],
        options: { sides: 6 },
        notation: 123
      }
      expect(isValidationResult(wrongNotationType)).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns true for ValidationResult with extra properties', () => {
      const resultWithExtraProps = {
        ...createValidValidationResult(),
        extraProperty: 'should not affect validation',
        anotherExtra: 42
      }
      expect(isValidationResult(resultWithExtraProps)).toBe(true)
    })

    test('returns false for objects with only some required properties', () => {
      const partialObject = {
        valid: true,
        description: ['Test']
        // Missing options and notation
      }
      expect(isValidationResult(partialObject)).toBe(false)
    })

    test('returns false for Date objects', () => {
      expect(isValidationResult(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isValidationResult(/test/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isValidationResult(new Error('test'))).toBe(false)
    })

    test('returns true for InvalidValidationResult without notation', () => {
      const invalidWithoutNotation = {
        valid: false,
        description: ['Invalid'],
        options: {}
      }
      expect(isValidationResult(invalidWithoutNotation)).toBe(true)
    })

    test('returns true for InvalidValidationResult with notation (extra property)', () => {
      const invalidWithNotation = {
        valid: false,
        description: ['Invalid'],
        options: {},
        notation: 'some notation'
      }
      expect(isValidationResult(invalidWithNotation)).toBe(true)
    })
  })
})

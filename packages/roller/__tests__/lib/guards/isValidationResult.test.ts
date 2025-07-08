import { describe, expect, test } from 'bun:test'
import {
  isCustomValidationResult,
  isInvalidValidationResult,
  isNumericValidationResult,
  validateNotation
} from '../../../src'

describe('Validation Result Type Guards', () => {
  describe('isNumericValidationResult', () => {
    test('should return true for valid numeric validation results', () => {
      const result = validateNotation('4d6')
      expect(isNumericValidationResult(result)).toBe(true)

      if (isNumericValidationResult(result)) {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('numeric')
        expect(typeof result.digested.sides).toBe('number')
        expect(typeof result.notation).toBe('string')
        expect(Array.isArray(result.description)).toBe(true)
      }
    })

    test('should return true for numeric validation with modifiers', () => {
      const result = validateNotation('4d6L+2')
      expect(isNumericValidationResult(result)).toBe(true)

      if (isNumericValidationResult(result)) {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('numeric')
        expect(typeof result.digested.sides).toBe('number')
        expect(result.digested.modifiers).toBeDefined()
      }
    })

    test('should return true for complex numeric notation', () => {
      const result = validateNotation('2d20H')
      expect(isNumericValidationResult(result)).toBe(true)

      if (isNumericValidationResult(result)) {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('numeric')
        expect(result.digested.sides).toBe(20)
        expect(result.digested.quantity).toBe(2)
      }
    })

    test('should return true for various numeric dice', () => {
      const notations = ['1d4', '2d6', '1d8', '1d10', '1d12', '1d20', '1d100']

      notations.forEach((notation) => {
        const result = validateNotation(notation)
        expect(isNumericValidationResult(result)).toBe(true)

        if (isNumericValidationResult(result)) {
          expect(result.type).toBe('numeric')
          expect(typeof result.digested.sides).toBe('number')
        }
      })
    })

    test('should return false for custom validation results', () => {
      const result = validateNotation('2d{HT}')
      expect(isNumericValidationResult(result)).toBe(false)
    })

    test('should return false for invalid validation results', () => {
      const result = validateNotation('invalid')
      expect(isNumericValidationResult(result)).toBe(false)
    })

    test('should return false for non-validation objects', () => {
      expect(isNumericValidationResult(null)).toBe(false)
      expect(isNumericValidationResult(undefined)).toBe(false)
      expect(isNumericValidationResult({})).toBe(false)
      expect(isNumericValidationResult([])).toBe(false)
      expect(isNumericValidationResult('4d6')).toBe(false)
      expect(isNumericValidationResult(true)).toBe(false)
    })

    test('should return false for objects missing required properties', () => {
      const incomplete = {
        valid: true,
        type: 'numeric'
        // missing description, digested, notation
      }
      expect(isNumericValidationResult(incomplete)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [
        validateNotation('4d6'),
        validateNotation('2d{HT}'),
        validateNotation('invalid'),
        validateNotation('2d20+5'),
        null
      ]

      const numericResults = results.filter(isNumericValidationResult)
      expect(numericResults).toHaveLength(2)

      numericResults.forEach((result) => {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('numeric')
      })
    })
  })

  describe('isCustomValidationResult', () => {
    test('should return true for valid custom validation results', () => {
      const result = validateNotation('2d{HT}')
      expect(isCustomValidationResult(result)).toBe(true)

      if (isCustomValidationResult(result)) {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('custom')
        expect(Array.isArray(result.digested.sides)).toBe(true)
        expect(typeof result.notation).toBe('string')
        expect(Array.isArray(result.description)).toBe(true)
      }
    })

    test('should return true for various custom dice notation', () => {
      const notations = [
        '2d{HT}',
        '3d{abc}',
        '4d{red,blue,green,yellow}',
        '1d{critical,hit,miss}',
        '2d{⚔️🛡️🏹}'
      ]

      notations.forEach((notation) => {
        const result = validateNotation(notation)
        expect(isCustomValidationResult(result)).toBe(true)

        if (isCustomValidationResult(result)) {
          expect(result.type).toBe('custom')
          expect(Array.isArray(result.digested.sides)).toBe(true)
          expect(
            result.digested.sides.every((face) => typeof face === 'string')
          ).toBe(true)
        }
      })
    })

    test('should return true for coin flip notation', () => {
      const result = validateNotation('2d{HT}')
      expect(isCustomValidationResult(result)).toBe(true)

      if (isCustomValidationResult(result)) {
        expect(result.digested.sides).toEqual(['H', 'T'])
        expect(result.digested.quantity).toBe(2)
      }
    })

    test('should return false for numeric validation results', () => {
      const result = validateNotation('4d6')
      expect(isCustomValidationResult(result)).toBe(false)
    })

    test('should return false for invalid validation results', () => {
      const result = validateNotation('invalid')
      expect(isCustomValidationResult(result)).toBe(false)
    })

    test('should return false for non-validation objects', () => {
      expect(isCustomValidationResult(null)).toBe(false)
      expect(isCustomValidationResult(undefined)).toBe(false)
      expect(isCustomValidationResult({})).toBe(false)
      expect(isCustomValidationResult([])).toBe(false)
      expect(isCustomValidationResult('2d{HT}')).toBe(false)
      expect(isCustomValidationResult(true)).toBe(false)
    })

    test('should return false for objects missing required properties', () => {
      const incomplete = {
        valid: true,
        type: 'custom'
        // missing description, digested, notation
      }
      expect(isCustomValidationResult(incomplete)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [
        validateNotation('2d{HT}'),
        validateNotation('4d6'),
        validateNotation('invalid'),
        validateNotation('3d{abc}'),
        null
      ]

      const customResults = results.filter(isCustomValidationResult)
      expect(customResults).toHaveLength(2)

      customResults.forEach((result) => {
        expect(result.valid).toBe(true)
        expect(result.type).toBe('custom')
      })
    })
  })

  describe('isInvalidValidationResult', () => {
    test('should return true for invalid validation results', () => {
      const result = validateNotation('invalid')
      expect(isInvalidValidationResult(result)).toBe(true)

      if (isInvalidValidationResult(result)) {
        expect(result.valid).toBe(false)
        expect(result.type).toBe('invalid')
        expect(Array.isArray(result.description)).toBe(true)
        expect(typeof result.digested).toBe('object')
      }
    })

    test('should return true for various invalid notations', () => {
      const invalidNotations = [
        'invalid',
        '',
        'd6',
        '4d',
        '4x6',
        'hello world',
        '4d6X',
        '4d6R',
        '2d{',
        '2d}'
      ]

      invalidNotations.forEach((notation) => {
        const result = validateNotation(notation)
        expect(isInvalidValidationResult(result)).toBe(true)

        if (isInvalidValidationResult(result)) {
          expect(result.valid).toBe(false)
          expect(result.type).toBe('invalid')
          expect(result.description.length).toBeGreaterThan(0)
        }
      })
    })

    test('should return false for valid numeric validation results', () => {
      const result = validateNotation('4d6')
      expect(isInvalidValidationResult(result)).toBe(false)
    })

    test('should return false for valid custom validation results', () => {
      const result = validateNotation('2d{HT}')
      expect(isInvalidValidationResult(result)).toBe(false)
    })

    test('should return false for non-validation objects', () => {
      expect(isInvalidValidationResult(null)).toBe(false)
      expect(isInvalidValidationResult(undefined)).toBe(false)
      expect(isInvalidValidationResult({})).toBe(false)
      expect(isInvalidValidationResult([])).toBe(false)
      expect(isInvalidValidationResult('invalid')).toBe(false)
      expect(isInvalidValidationResult(true)).toBe(false)
    })

    test('should return false for objects missing required properties', () => {
      const incomplete = {
        valid: false,
        type: 'invalid'
        // missing description, digested
      }
      expect(isInvalidValidationResult(incomplete)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [
        validateNotation('4d6'),
        validateNotation('invalid'),
        validateNotation('2d{HT}'),
        validateNotation('hello'),
        validateNotation('d6'),
        null
      ]

      const invalidResults = results.filter(isInvalidValidationResult)
      expect(invalidResults).toHaveLength(3)

      invalidResults.forEach((result) => {
        expect(result.valid).toBe(false)
        expect(result.type).toBe('invalid')
      })
    })
  })

  describe('Mutual exclusivity', () => {
    test('should be mutually exclusive for validation results', () => {
      const notations = [
        '4d6',
        '2d{HT}',
        'invalid',
        '4d6L+2',
        '3d{abc}',
        'hello',
        '2d20H',
        'd6'
      ]

      notations.forEach((notation) => {
        const result = validateNotation(notation)

        const isNumeric = isNumericValidationResult(result)
        const isCustom = isCustomValidationResult(result)
        const isInvalid = isInvalidValidationResult(result)

        // Should be exactly one of the three, never multiple or none
        const trueCount = [isNumeric, isCustom, isInvalid].filter(
          Boolean
        ).length
        expect(trueCount).toBe(1)
      })
    })

    test('should all return false for non-validation objects', () => {
      const invalidInputs = [
        null,
        undefined,
        {},
        [],
        '4d6',
        true,
        42,
        { valid: true }, // incomplete
        { type: 'numeric' } // incomplete
      ]

      invalidInputs.forEach((input) => {
        expect(isNumericValidationResult(input)).toBe(false)
        expect(isCustomValidationResult(input)).toBe(false)
        expect(isInvalidValidationResult(input)).toBe(false)
      })
    })
  })

  describe('Type narrowing', () => {
    test('should provide proper TypeScript type narrowing for numeric results', () => {
      const result: unknown = validateNotation('4d6+2')

      if (isNumericValidationResult(result)) {
        // TypeScript should know this is NumericValidationResult
        expect(result.valid).toBe(true)
        expect(result.type).toBe('numeric')
        expect(typeof result.digested.sides).toBe('number')
        expect(typeof result.notation).toBe('string')
      }
    })

    test('should provide proper TypeScript type narrowing for custom results', () => {
      const result: unknown = validateNotation('2d{HT}')

      if (isCustomValidationResult(result)) {
        // TypeScript should know this is CustomValidationResult
        expect(result.valid).toBe(true)
        expect(result.type).toBe('custom')
        expect(Array.isArray(result.digested.sides)).toBe(true)
        expect(typeof result.notation).toBe('string')
      }
    })

    test('should provide proper TypeScript type narrowing for invalid results', () => {
      const result: unknown = validateNotation('invalid')

      if (isInvalidValidationResult(result)) {
        // TypeScript should know this is InvalidValidationResult
        expect(result.valid).toBe(false)
        expect(result.type).toBe('invalid')
        expect(Array.isArray(result.description)).toBe(true)
      }
    })

    test('should enable type-safe validation result processing', () => {
      const notations = ['4d6', '2d{HT}', 'invalid', '2d20+5']

      const numericResults: unknown[] = []
      const customResults: unknown[] = []
      const invalidResults: unknown[] = []

      notations.forEach((notation) => {
        const result = validateNotation(notation)

        if (isNumericValidationResult(result)) {
          numericResults.push(result)
          expect(typeof result.digested.sides).toBe('number')
        } else if (isCustomValidationResult(result)) {
          customResults.push(result)
          expect(Array.isArray(result.digested.sides)).toBe(true)
        } else if (isInvalidValidationResult(result)) {
          invalidResults.push(result)
          expect(result.valid).toBe(false)
        }
      })

      expect(numericResults).toHaveLength(2)
      expect(customResults).toHaveLength(1)
      expect(invalidResults).toHaveLength(1)
    })
  })
})

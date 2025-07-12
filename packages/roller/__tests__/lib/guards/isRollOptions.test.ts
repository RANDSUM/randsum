import { describe, expect, test } from 'bun:test'
import { isRollOptions } from '../../../src/lib/guards/isRollOptions'
import type { RollOptions } from '../../../src/types'

// Helper function to create a valid RollOptions for testing
function createRollOptions(overrides: Partial<RollOptions> = {}): RollOptions {
  return {
    sides: 6,
    quantity: 1,
    ...overrides
  }
}

describe('isRollOptions', () => {
  describe('valid RollOptions objects', () => {
    test('returns true for minimal RollOptions with only sides', () => {
      const minimalOptions = { sides: 6 }
      expect(isRollOptions(minimalOptions)).toBe(true)
    })

    test('returns true for complete RollOptions with all properties', () => {
      const completeOptions = createRollOptions({
        sides: 20,
        quantity: 4,
        modifiers: {
          drop: { lowest: 1 },
          plus: 3
        }
      })
      expect(isRollOptions(completeOptions)).toBe(true)
    })

    test('returns true for RollOptions with quantity but no modifiers', () => {
      const optionsWithQuantity = {
        sides: 8,
        quantity: 2
      }
      expect(isRollOptions(optionsWithQuantity)).toBe(true)
    })

    test('returns true for RollOptions with modifiers but no quantity', () => {
      const optionsWithModifiers = {
        sides: 10,
        modifiers: {
          explode: true,
          reroll: { exact: [1] }
        }
      }
      expect(isRollOptions(optionsWithModifiers)).toBe(true)
    })

    test('returns true for RollOptions with empty modifiers object', () => {
      const emptyModifiers = {
        sides: 12,
        quantity: 3,
        modifiers: {}
      }
      expect(isRollOptions(emptyModifiers)).toBe(true)
    })

    test('returns true for RollOptions with complex modifiers', () => {
      const complexModifiers = {
        sides: 6,
        quantity: 4,
        modifiers: {
          drop: { lowest: 1, highest: 1 },
          reroll: { exact: [1, 2], max: 3 },
          cap: { greaterThan: 5, lessThan: 2 },
          replace: [{ from: 1, to: 2 }],
          unique: { notUnique: [6] },
          explode: true,
          plus: 5,
          minus: 2
        }
      }
      expect(isRollOptions(complexModifiers)).toBe(true)
    })

    test('returns true for RollOptions with extra properties', () => {
      const extraProps = {
        sides: 4,
        quantity: 1,
        extraProperty: 'should not affect validation',
        anotherExtra: 42
      }
      expect(isRollOptions(extraProps)).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isRollOptions(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isRollOptions(undefined)).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(isRollOptions(42)).toBe(false)
      expect(isRollOptions(0)).toBe(false)
      expect(isRollOptions(-1)).toBe(false)
    })

    test('returns false for strings', () => {
      expect(isRollOptions('')).toBe(false)
      expect(isRollOptions('6')).toBe(false)
      expect(isRollOptions('{"sides": 6}')).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isRollOptions(true)).toBe(false)
      expect(isRollOptions(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isRollOptions([])).toBe(false)
      expect(isRollOptions([6])).toBe(false)
      expect(isRollOptions([{ sides: 6 }])).toBe(false)
    })

    test('returns false for functions', () => {
      expect(isRollOptions(() => {})).toBe(false)
      expect(isRollOptions(function() {})).toBe(false)
    })
  })

  describe('objects missing required properties', () => {
    test('returns false for empty object', () => {
      expect(isRollOptions({})).toBe(false)
    })

    test('returns false when missing sides property', () => {
      const missingSides = {
        quantity: 2,
        modifiers: { plus: 1 }
      }
      expect(isRollOptions(missingSides)).toBe(false)
    })
  })

  describe('objects with properties of wrong types', () => {
    test('returns false when sides is not a number', () => {
      const wrongSidesType = {
        sides: '6',
        quantity: 1
      }
      expect(isRollOptions(wrongSidesType)).toBe(false)
    })

    test('returns false when sides is null', () => {
      const nullSides = {
        sides: null,
        quantity: 1
      }
      expect(isRollOptions(nullSides)).toBe(false)
    })

    test('returns false when quantity is not a number', () => {
      const wrongQuantityType = {
        sides: 6,
        quantity: '2'
      }
      expect(isRollOptions(wrongQuantityType)).toBe(false)
    })

    test('returns false when modifiers is not an object', () => {
      const wrongModifiersType = {
        sides: 6,
        quantity: 1,
        modifiers: 'not an object'
      }
      expect(isRollOptions(wrongModifiersType)).toBe(false)
    })

    test('returns false when modifiers is null', () => {
      const nullModifiers = {
        sides: 6,
        quantity: 1,
        modifiers: null
      }
      expect(isRollOptions(nullModifiers)).toBe(false)
    })

    test('returns false when modifiers is an array', () => {
      const arrayModifiers = {
        sides: 6,
        quantity: 1,
        modifiers: []
      }
      expect(isRollOptions(arrayModifiers)).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns true for RollOptions with zero sides', () => {
      const zeroSides = { sides: 0 }
      expect(isRollOptions(zeroSides)).toBe(true)
    })

    test('returns true for RollOptions with negative sides', () => {
      const negativeSides = { sides: -1 }
      expect(isRollOptions(negativeSides)).toBe(true)
    })

    test('returns true for RollOptions with zero quantity', () => {
      const zeroQuantity = { sides: 6, quantity: 0 }
      expect(isRollOptions(zeroQuantity)).toBe(true)
    })

    test('returns true for RollOptions with negative quantity', () => {
      const negativeQuantity = { sides: 6, quantity: -1 }
      expect(isRollOptions(negativeQuantity)).toBe(true)
    })

    test('returns false for Date objects', () => {
      expect(isRollOptions(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isRollOptions(/test/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isRollOptions(new Error('test'))).toBe(false)
    })

    test('returns false for Map objects', () => {
      expect(isRollOptions(new Map())).toBe(false)
    })

    test('returns false for Set objects', () => {
      expect(isRollOptions(new Set())).toBe(false)
    })
  })
})

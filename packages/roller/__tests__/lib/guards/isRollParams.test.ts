import { describe, expect, test } from 'bun:test'
import { isRollParams } from '../../../src/lib/guards/isRollParams'
import type { RollOptions, RollParams } from '../../../src/types'

// Helper function to create a valid RollParams for testing
function createRollParams(overrides: Partial<RollParams> = {}): RollParams {
  return {
    description: ['Roll 1d6'],
    argument: '1d6',
    options: { sides: 6, quantity: 1 },
    notation: '1d6',
    ...overrides
  }
}

describe('isRollParams', () => {
  describe('valid RollParams objects', () => {
    test('returns true for complete RollParams with string argument', () => {
      const validParams = createRollParams()
      expect(isRollParams(validParams)).toBe(true)
    })

    test('returns true for RollParams with number argument', () => {
      const numberArgument = createRollParams({
        argument: 20,
        notation: '1d20',
        options: { sides: 20, quantity: 1 }
      })
      expect(isRollParams(numberArgument)).toBe(true)
    })

    test('returns true for RollParams with RollOptions argument', () => {
      const optionsArgument: RollOptions = { sides: 8, quantity: 2 }
      const rollOptionsArgument = createRollParams({
        argument: optionsArgument,
        notation: '2d8',
        options: optionsArgument
      })
      expect(isRollParams(rollOptionsArgument)).toBe(true)
    })

    test('returns true for RollParams with complex options', () => {
      const complexParams = createRollParams({
        description: ['Roll 4d6, drop lowest, add 3'],
        argument: '4d6L+3',
        options: {
          sides: 6,
          quantity: 4,
          modifiers: {
            drop: { lowest: 1 },
            plus: 3
          }
        },
        notation: '4d6L+3'
      })
      expect(isRollParams(complexParams)).toBe(true)
    })

    test('returns true for RollParams with empty description array', () => {
      const emptyDescription = createRollParams({
        description: []
      })
      expect(isRollParams(emptyDescription)).toBe(true)
    })

    test('returns true for RollParams with multiple description entries', () => {
      const multipleDescriptions = createRollParams({
        description: ['Roll 2d10', 'Add modifier', 'Check for critical']
      })
      expect(isRollParams(multipleDescriptions)).toBe(true)
    })

    test('returns true for RollParams with extra properties', () => {
      const extraProps = {
        ...createRollParams(),
        extraProperty: 'should not affect validation',
        anotherExtra: 42
      }
      expect(isRollParams(extraProps)).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isRollParams(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isRollParams(undefined)).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(isRollParams(42)).toBe(false)
      expect(isRollParams(0)).toBe(false)
      expect(isRollParams(-1)).toBe(false)
    })

    test('returns false for strings', () => {
      expect(isRollParams('')).toBe(false)
      expect(isRollParams('1d6')).toBe(false)
      expect(isRollParams('{"description": ["test"]}')).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isRollParams(true)).toBe(false)
      expect(isRollParams(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isRollParams([])).toBe(false)
      expect(isRollParams([1, 2, 3])).toBe(false)
    })

    test('returns false for functions', () => {
      expect(
        isRollParams(() => {
          // noop
        })
      ).toBe(false)
      expect(
        isRollParams(() => {
          // noop
        })
      ).toBe(false)
    })
  })

  describe('objects missing required properties', () => {
    test('returns false for empty object', () => {
      expect(isRollParams({})).toBe(false)
    })

    test('returns false when missing description property', () => {
      const missingDescription = {
        argument: '1d6',
        options: { sides: 6, quantity: 1 },
        notation: '1d6'
      }
      expect(isRollParams(missingDescription)).toBe(false)
    })

    test('returns false when missing argument property', () => {
      const missingArgument = {
        description: ['Roll 1d6'],
        options: { sides: 6, quantity: 1 },
        notation: '1d6'
      }
      expect(isRollParams(missingArgument)).toBe(false)
    })

    test('returns false when missing options property', () => {
      const missingOptions = {
        description: ['Roll 1d6'],
        argument: '1d6',
        notation: '1d6'
      }
      expect(isRollParams(missingOptions)).toBe(false)
    })

    test('returns false when missing notation property', () => {
      const missingNotation = {
        description: ['Roll 1d6'],
        argument: '1d6',
        options: { sides: 6, quantity: 1 }
      }
      expect(isRollParams(missingNotation)).toBe(false)
    })
  })

  describe('objects with properties of wrong types', () => {
    test('returns false when description is not an array', () => {
      const wrongDescriptionType = {
        description: 'not an array',
        argument: '1d6',
        options: { sides: 6, quantity: 1 },
        notation: '1d6'
      }
      expect(isRollParams(wrongDescriptionType)).toBe(false)
    })

    test('returns false when argument is null', () => {
      const nullArgument = {
        description: ['Roll 1d6'],
        argument: null,
        options: { sides: 6, quantity: 1 },
        notation: '1d6'
      }
      expect(isRollParams(nullArgument)).toBe(false)
    })

    test('returns false when argument is undefined', () => {
      const undefinedArgument = {
        description: ['Roll 1d6'],
        argument: undefined,
        options: { sides: 6, quantity: 1 },
        notation: '1d6'
      }
      expect(isRollParams(undefinedArgument)).toBe(false)
    })

    test('returns false when options is not a valid RollOptions', () => {
      const invalidOptions = {
        description: ['Roll 1d6'],
        argument: '1d6',
        options: { notSides: 6 },
        notation: '1d6'
      }
      expect(isRollParams(invalidOptions)).toBe(false)
    })

    test('returns false when notation is not a string', () => {
      const wrongNotationType = {
        description: ['Roll 1d6'],
        argument: '1d6',
        options: { sides: 6, quantity: 1 },
        notation: 123
      }
      expect(isRollParams(wrongNotationType)).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns false for objects with only some required properties', () => {
      const partialObject = {
        description: ['Roll 1d6'],
        argument: '1d6'
      }
      expect(isRollParams(partialObject)).toBe(false)
    })

    test('returns false for Date objects', () => {
      expect(isRollParams(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isRollParams(/test/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isRollParams(new Error('test'))).toBe(false)
    })

    test('returns false for Map objects', () => {
      expect(isRollParams(new Map())).toBe(false)
    })

    test('returns false for Set objects', () => {
      expect(isRollParams(new Set())).toBe(false)
    })

    test('returns true for RollParams with template literal argument', () => {
      const templateLiteralArg = createRollParams({
        argument: '6' as `${number}`,
        notation: '1d6',
        options: { sides: 6, quantity: 1 }
      })
      expect(isRollParams(templateLiteralArg)).toBe(true)
    })

    test('returns false when options has invalid structure', () => {
      const invalidOptionsStructure = {
        description: ['Roll 1d6'],
        argument: '1d6',
        options: { sides: 'six' },
        notation: '1d6'
      }
      expect(isRollParams(invalidOptionsStructure)).toBe(false)
    })

    test('returns false for nested objects that look like RollParams', () => {
      const nestedFakeParams = {
        nested: {
          description: ['Roll 1d6'],
          argument: '1d6',
          options: { sides: 6, quantity: 1 },
          notation: '1d6'
        }
      }
      expect(isRollParams(nestedFakeParams)).toBe(false)
    })
  })
})

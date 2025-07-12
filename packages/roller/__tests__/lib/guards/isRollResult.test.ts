import { describe, expect, test } from 'bun:test'
import { isRollResult } from '../../../src/lib/guards/isRollResult'
import type { RollHistory, RollParams, RollResult } from '../../../src/types'

// Helper function to create a valid RollResult for testing
function createValidRollResult(
  overrides: Partial<RollResult> = {}
): RollResult {
  const defaultHistory: RollHistory = {
    modifiedRolls: [1, 2, 3],
    total: 6,
    initialRolls: [1, 2, 3],
    logs: []
  }

  const defaultParams: RollParams = {
    description: ['Roll 3d6'],
    argument: '3d6',
    options: { sides: 6, quantity: 3 },
    notation: '3d6'
  }

  return {
    parameters: defaultParams,
    description: defaultParams.description,
    rolls: defaultHistory.modifiedRolls,
    history: defaultHistory,
    total: 6,
    ...overrides
  }
}

// Helper function to create a minimal valid RollResult
function createMinimalValidRollResult(): RollResult {
  return createValidRollResult({
    parameters: {
      description: ['Test'],
      argument: 1,
      options: { sides: 6 },
      notation: '1d6'
    },
    description: ['Test'],
    rolls: [1],
    history: {
      modifiedRolls: [1],
      total: 1,
      initialRolls: [1],
      logs: []
    },
    total: 1
  })
}

describe('isRollResult', () => {
  describe('valid RollResult objects', () => {
    test('returns true for a complete valid RollResult', () => {
      const validResult = createValidRollResult()
      expect(isRollResult(validResult)).toBe(true)
    })

    test('returns true for a minimal valid RollResult', () => {
      const minimalResult = createMinimalValidRollResult()
      expect(isRollResult(minimalResult)).toBe(true)
    })

    test('returns true for RollResult with complex history', () => {
      const complexResult = createValidRollResult({
        history: {
          modifiedRolls: [2, 4, 6, 8],
          total: 20,
          initialRolls: [1, 3, 5, 7],
          logs: [
            {
              modifier: 'plus',
              options: 1,
              added: [1, 1, 1, 1],
              removed: []
            }
          ]
        },
        rolls: [2, 4, 6, 8],
        total: 20
      })
      expect(isRollResult(complexResult)).toBe(true)
    })

    test('returns true for RollResult with empty arrays', () => {
      const emptyArraysResult = createValidRollResult({
        rolls: [],
        history: {
          modifiedRolls: [],
          total: 0,
          initialRolls: [],
          logs: []
        },
        total: 0
      })
      expect(isRollResult(emptyArraysResult)).toBe(true)
    })
  })

  describe('invalid primitive values', () => {
    test('returns false for null', () => {
      expect(isRollResult(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(isRollResult(undefined)).toBe(false)
    })

    test('returns false for numbers', () => {
      expect(isRollResult(42)).toBe(false)
      expect(isRollResult(0)).toBe(false)
      expect(isRollResult(-1)).toBe(false)
      expect(isRollResult(NaN)).toBe(false)
      expect(isRollResult(Infinity)).toBe(false)
    })

    test('returns false for strings', () => {
      expect(isRollResult('')).toBe(false)
      expect(isRollResult('test')).toBe(false)
      expect(isRollResult('{"total": 5}')).toBe(false)
    })

    test('returns false for booleans', () => {
      expect(isRollResult(true)).toBe(false)
      expect(isRollResult(false)).toBe(false)
    })

    test('returns false for arrays', () => {
      expect(isRollResult([])).toBe(false)
      expect(isRollResult([1, 2, 3])).toBe(false)
      expect(isRollResult(['parameters', 'history', 'total'])).toBe(false)
    })

    test('returns false for functions', () => {
      expect(
        isRollResult(() => {
          // noop
        })
      ).toBe(false)
      expect(
        isRollResult(() => {
          // noop
        })
      ).toBe(false)
    })
  })

  describe('objects missing required properties', () => {
    test('returns false for empty object', () => {
      expect(isRollResult({})).toBe(false)
    })

    test('returns false when missing parameters property', () => {
      const missingParameters = {
        description: ['Test'],
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(missingParameters)).toBe(false)
    })

    test('returns false when missing description property', () => {
      const missingDescription = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(missingDescription)).toBe(false)
    })

    test('returns false when missing rolls property', () => {
      const missingRolls = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(missingRolls)).toBe(false)
    })

    test('returns false when missing history property', () => {
      const missingHistory = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        rolls: [1],
        total: 1
      }
      expect(isRollResult(missingHistory)).toBe(false)
    })

    test('returns false when missing total property', () => {
      const missingTotal = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] }
      }
      expect(isRollResult(missingTotal)).toBe(false)
    })

    test('returns false when missing multiple properties', () => {
      const missingMultiple = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        total: 1
      }
      expect(isRollResult(missingMultiple)).toBe(false)
    })
  })

  describe('objects with properties of wrong types', () => {
    test('returns false when parameters is not an object', () => {
      const wrongParametersType = {
        parameters: 'not an object',
        description: ['Test'],
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(wrongParametersType)).toBe(false)
    })

    test('returns false when description is not an array', () => {
      const wrongDescriptionType = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: 'not an array',
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(wrongDescriptionType)).toBe(false)
    })

    test('returns false when rolls is not an array', () => {
      const wrongRollsType = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        rolls: 'not an array',
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 1
      }
      expect(isRollResult(wrongRollsType)).toBe(false)
    })

    test('returns false when history is not an object', () => {
      const wrongHistoryType = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        rolls: [1],
        history: 'not an object',
        total: 1
      }
      expect(isRollResult(wrongHistoryType)).toBe(false)
    })

    test('returns false when total is not a number', () => {
      const wrongTotalType = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        description: ['Test'],
        rolls: [1],
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] },
        total: 'not a number'
      }
      expect(isRollResult(wrongTotalType)).toBe(false)
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('returns true for RollResult with extra properties', () => {
      const resultWithExtraProps = {
        ...createValidRollResult(),
        extraProperty: 'should not affect validation',
        anotherExtra: 42
      }
      expect(isRollResult(resultWithExtraProps)).toBe(true)
    })

    test('returns false for objects with only some required properties', () => {
      const partialObject = {
        parameters: {
          description: ['Test'],
          argument: 1,
          options: { sides: 6 },
          notation: '1d6'
        },
        history: { modifiedRolls: [1], total: 1, initialRolls: [1], logs: [] }
        // Missing description, rolls, and total
      }
      expect(isRollResult(partialObject)).toBe(false)
    })

    test('returns false for nested objects that look like RollResult', () => {
      const nestedFakeResult = {
        nested: {
          parameters: {
            description: ['Test'],
            argument: 1,
            options: { sides: 6 },
            notation: '1d6'
          },
          description: ['Test'],
          rolls: [1],
          history: {
            modifiedRolls: [1],
            total: 1,
            initialRolls: [1],
            logs: []
          },
          total: 1
        }
      }
      expect(isRollResult(nestedFakeResult)).toBe(false)
    })

    test('returns false for Date objects', () => {
      expect(isRollResult(new Date())).toBe(false)
    })

    test('returns false for RegExp objects', () => {
      expect(isRollResult(/test/)).toBe(false)
    })

    test('returns false for Error objects', () => {
      expect(isRollResult(new Error('test'))).toBe(false)
    })

    test('returns false for Map objects', () => {
      expect(isRollResult(new Map())).toBe(false)
    })

    test('returns false for Set objects', () => {
      expect(isRollResult(new Set())).toBe(false)
    })
  })
})

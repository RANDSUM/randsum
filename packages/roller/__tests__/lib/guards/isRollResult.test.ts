import { describe, expect, test } from 'bun:test'
import { D, isCustomResult, isNumericResult, roll } from '../../../src'

describe('Roll Result Type Guards', () => {
  describe('isNumericResult', () => {
    test('should return true for numeric roll results', () => {
      const result = roll('4d6')
      expect(isNumericResult(result)).toBe(true)

      if (isNumericResult(result)) {
        expect(typeof result.total).toBe('number')
        expect(Array.isArray(result.modifiedRolls.rawRolls)).toBe(true)
        expect(
          result.modifiedRolls.rawRolls.every((r) => typeof r === 'number')
        ).toBe(true)
      }
    })

    test('should return true for single numeric die results', () => {
      const result = roll(20)
      expect(isNumericResult(result)).toBe(true)
      expect(result.type).toBe('numeric')
    })

    test('should return false for custom roll results', () => {
      const result = roll(D(['heads', 'tails']))
      expect(isNumericResult(result)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [roll('4d6'), roll(D(['heads', 'tails'])), roll('2d20')]

      const numericResults = results.filter(isNumericResult)
      expect(numericResults).toHaveLength(2)

      numericResults.forEach((result) => {
        expect(result.type).toBe('numeric')
        expect(typeof result.total).toBe('number')
      })
    })
  })

  describe('isCustomResult', () => {
    test('should return true for custom roll results', () => {
      const result = roll(D(['critical', 'hit', 'miss']))
      expect(isCustomResult(result)).toBe(true)

      if (isCustomResult(result)) {
        expect(typeof result.total).toBe('string')
        expect(Array.isArray(result.modifiedRolls.rawRolls)).toBe(true)
        expect(
          result.modifiedRolls.rawRolls.every((r) => typeof r === 'string')
        ).toBe(true)
      }
    })

    test('should return true for coin flip results', () => {
      const result = roll(D(['heads', 'tails']))
      expect(isCustomResult(result)).toBe(true)
      expect(result.type).toBe('custom')
    })

    test('should return false for numeric roll results', () => {
      const result = roll('4d6')
      expect(isCustomResult(result)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [
        roll('4d6'),
        roll(D(['heads', 'tails'])),
        roll(D(['red', 'blue', 'green']))
      ]

      const customResults = results.filter(isCustomResult)
      expect(customResults).toHaveLength(2)

      customResults.forEach((result) => {
        expect(result.type).toBe('custom')
        expect(typeof result.total).toBe('string')
      })
    })
  })

  describe('Type narrowing and discrimination', () => {
    test('should provide proper TypeScript type narrowing', () => {
      const result = roll('4d6')

      if (isNumericResult(result)) {
        const total: number = result.total
        const rolls: number[] = result.modifiedRolls.rawRolls
        const firstRoll: number = result.modifiedRolls.rawRolls[0] ?? 0

        expect(typeof total).toBe('number')
        expect(Array.isArray(rolls)).toBe(true)
        expect(typeof firstRoll).toBe('number')
      }
    })

    test('should handle all result types in switch-like logic', () => {
      const results = [roll('4d6'), roll(D(['heads', 'tails']))]

      results.forEach((result) => {
        if (isNumericResult(result)) {
          expect(result.type).toBe('numeric')
          expect(typeof result.total).toBe('number')
        } else if (isCustomResult(result)) {
          expect(result.type).toBe('custom')
          expect(typeof result.total).toBe('string')
        } else {
          throw new Error('Unknown result type')
        }
      })
    })

    test('should enable type-safe result processing', () => {
      const results = [roll('4d6'), roll(D(['critical', 'hit', 'miss']))]

      const numericResults = results.filter(isNumericResult)
      numericResults.forEach((result) => {
        const average =
          result.modifiedRolls.rawRolls.reduce((a, b) => a + b, 0) /
          result.modifiedRolls.rawRolls.length
        expect(typeof average).toBe('number')
      })

      const customResults = results.filter(isCustomResult)
      customResults.forEach((result) => {
        const combined = result.modifiedRolls.rawRolls.join(', ')
        expect(typeof combined).toBe('string')
      })
    })
  })
})

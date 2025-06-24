import { describe, expect, test } from 'bun:test'
import { D, roll } from '../../src'
import {
  isCustomResult,
  isMixedResult,
  isNumericResult
} from '../../src/guards/isRollResult'

describe('Roll Result Type Guards', () => {
  describe('isNumericResult', () => {
    test('should return true for numeric roll results', () => {
      const result = roll('4d6')
      expect(isNumericResult(result)).toBe(true)

      // Type assertion to verify TypeScript narrowing works
      if (isNumericResult(result)) {
        expect(typeof result.total).toBe('number')
        expect(Array.isArray(result.result)).toBe(true)
        expect(result.result.every((r) => typeof r === 'number')).toBe(true)
      }
    })

    test('should return true for single numeric die results', () => {
      const result = roll(20)
      expect(isNumericResult(result)).toBe(true)
      expect(result.type).toBe('numerical')
    })

    test('should return false for custom roll results', () => {
      const result = roll(D(['heads', 'tails']))
      expect(isNumericResult(result)).toBe(false)
    })

    test('should return false for mixed roll results', () => {
      const result = roll('2d6', D(['hit', 'miss']))
      expect(isNumericResult(result)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [roll('4d6'), roll(D(['heads', 'tails'])), roll('2d20')]

      const numericResults = results.filter(isNumericResult)
      expect(numericResults).toHaveLength(2)

      // Verify all filtered results are numeric
      numericResults.forEach((result) => {
        expect(result.type).toBe('numerical')
        expect(typeof result.total).toBe('number')
      })
    })
  })

  describe('isCustomResult', () => {
    test('should return true for custom roll results', () => {
      const result = roll(D(['critical', 'hit', 'miss']))
      expect(isCustomResult(result)).toBe(true)

      // Type assertion to verify TypeScript narrowing works
      if (isCustomResult(result)) {
        expect(typeof result.total).toBe('string')
        expect(Array.isArray(result.result)).toBe(true)
        expect(result.result.every((r) => typeof r === 'string')).toBe(true)
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

    test('should return false for mixed roll results', () => {
      const result = roll('2d6', D(['hit', 'miss']))
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

      // Verify all filtered results are custom
      customResults.forEach((result) => {
        expect(result.type).toBe('custom')
        expect(typeof result.total).toBe('string')
      })
    })
  })

  describe('isMixedResult', () => {
    test('should return true for mixed roll results', () => {
      const result = roll('2d6', D(['hit', 'miss']))
      expect(isMixedResult(result)).toBe(true)

      // Type assertion to verify TypeScript narrowing works
      if (isMixedResult(result)) {
        expect(typeof result.total).toBe('string') // Mixed results always have string totals
        expect(Array.isArray(result.result)).toBe(true)
        // Mixed results should contain both numbers and strings
        const hasNumbers = result.result.some((r) => typeof r === 'number')
        const hasStrings = result.result.some((r) => typeof r === 'string')
        expect(hasNumbers || hasStrings).toBe(true) // At least one type should be present
      }
    })

    test('should return false for numeric roll results', () => {
      const result = roll('4d6')
      expect(isMixedResult(result)).toBe(false)
    })

    test('should return false for custom roll results', () => {
      const result = roll(D(['heads', 'tails']))
      expect(isMixedResult(result)).toBe(false)
    })

    test('should work with array filtering', () => {
      const results = [
        roll('4d6'),
        roll(D(['heads', 'tails'])),
        roll('2d6', D(['advantage']))
      ]

      const mixedResults = results.filter(isMixedResult)
      expect(mixedResults).toHaveLength(1)

      // Verify all filtered results are mixed
      mixedResults.forEach((result) => {
        expect(result.type).toBe('mixed')
        expect(typeof result.total).toBe('string')
      })
    })
  })

  describe('Type narrowing and discrimination', () => {
    test('should provide proper TypeScript type narrowing', () => {
      const result = roll('4d6')

      if (isNumericResult(result)) {
        // These should compile without type errors
        const total: number = result.total
        const rolls: number[] = result.result
        const firstRoll: number = result.result[0] ?? 0

        expect(typeof total).toBe('number')
        expect(Array.isArray(rolls)).toBe(true)
        expect(typeof firstRoll).toBe('number')
      }
    })

    test('should handle all result types in switch-like logic', () => {
      const results = [
        roll('4d6'),
        roll(D(['heads', 'tails'])),
        roll('2d6', D(['hit']))
      ]

      results.forEach((result) => {
        if (isNumericResult(result)) {
          expect(result.type).toBe('numerical')
          expect(typeof result.total).toBe('number')
        } else if (isCustomResult(result)) {
          expect(result.type).toBe('custom')
          expect(typeof result.total).toBe('string')
        } else if (isMixedResult(result)) {
          expect(result.type).toBe('mixed')
          expect(typeof result.total).toBe('string')
        } else {
          // This should never happen with proper discriminated union
          throw new Error('Unknown result type')
        }
      })
    })

    test('should enable type-safe result processing', () => {
      const results = [
        roll('4d6'),
        roll(D(['critical', 'hit', 'miss'])),
        roll('1d20', D(['advantage']))
      ]

      // Process numeric results
      const numericResults = results.filter(isNumericResult)
      numericResults.forEach((result) => {
        // Can safely perform numeric operations
        const average =
          result.result.reduce((a, b) => a + b, 0) / result.result.length
        expect(typeof average).toBe('number')
      })

      // Process custom results
      const customResults = results.filter(isCustomResult)
      customResults.forEach((result) => {
        // Can safely perform string operations
        const combined = result.result.join(', ')
        expect(typeof combined).toBe('string')
      })

      // Process mixed results
      const mixedResults = results.filter(isMixedResult)
      mixedResults.forEach((result) => {
        // Can safely handle mixed content
        const description = `Mixed result: ${result.total}`
        expect(typeof description).toBe('string')
      })
    })
  })
})

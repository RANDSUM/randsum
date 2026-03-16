/**
 * Tests for Story 6: Public API Surface Reduction
 *
 * Verifies:
 * - notation() is importable from the main barrel
 * - Comparison functions are importable from the main barrel
 * - Removed internal types are no longer in the public export surface
 *   (verified via ts-unused-exports / type checks — functional tests below
 *    verify the positive side: public-facing exports work as documented)
 */
import { describe, expect, test } from 'bun:test'
import * as roller from '../src/index'

describe('main barrel public surface', () => {
  describe('notation() is accessible from main barrel', () => {
    test('notation is a callable function', () => {
      expect(typeof roller.notation).toBe('function')
    })

    test('notation returns the string when valid', () => {
      expect(roller.notation('4d6')).toBe('4d6')
    })

    test('notation throws NotationParseError for invalid input', () => {
      expect(() => roller.notation('not-dice')).toThrow()
    })
  })

  describe('comparison functions are accessible from main barrel', () => {
    test('parseComparisonNotation is a callable function', () => {
      expect(typeof roller.parseComparisonNotation).toBe('function')
    })

    test('hasConditions is a callable function', () => {
      expect(typeof roller.hasConditions).toBe('function')
    })

    test('formatComparisonNotation is a callable function', () => {
      expect(typeof roller.formatComparisonNotation).toBe('function')
    })

    test('formatComparisonDescription is a callable function', () => {
      expect(typeof roller.formatComparisonDescription).toBe('function')
    })

    test('parseComparisonNotation parses conditions correctly', () => {
      const result = roller.parseComparisonNotation('{<3,>18}')
      expect(result).toHaveProperty('lessThan', 3)
      expect(result).toHaveProperty('greaterThan', 18)
    })

    test('hasConditions returns false for empty options', () => {
      expect(roller.hasConditions({})).toBe(false)
    })

    test('hasConditions returns true for filled options', () => {
      expect(roller.hasConditions({ greaterThan: 5 })).toBe(true)
    })

    test('formatComparisonNotation formats correctly', () => {
      const result = roller.formatComparisonNotation({ greaterThan: 5 })
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('5')
    })

    test('formatComparisonDescription formats as human-readable text', () => {
      const result = roller.formatComparisonDescription({ greaterThan: 5 })
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('5')
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/lib/modifiers/definitions'
import {
  buildNotationPattern,
  parseModifiers
} from '../../src/notation/parse/parseModifiers'

/**
 * Tests that verify parseModifiers and buildNotationPattern use RANDSUM_MODIFIERS
 * as the single source of truth for modifier schemas, eliminating the allSchemas
 * dual-maintenance hazard.
 *
 * Story 1: allSchemas Dual-Maintenance Elimination
 */
describe('parseModifiers — RANDSUM_MODIFIERS integration', () => {
  describe('buildNotationPattern', () => {
    test('pattern includes all modifier patterns from RANDSUM_MODIFIERS', () => {
      const pattern = buildNotationPattern()
      const source = pattern.source

      for (const modifier of RANDSUM_MODIFIERS) {
        expect(source).toContain(modifier.pattern.source)
      }
    })

    test('pattern count matches RANDSUM_MODIFIERS length plus sugar patterns', () => {
      // RANDSUM_MODIFIERS entries + marginOfSuccess + repeat operator + annotation + count-family sugar
      // The exact count depends on implementation, but at minimum all RANDSUM_MODIFIERS patterns are present
      const pattern = buildNotationPattern()
      const patternCount = pattern.source.split('|').length
      expect(patternCount).toBeGreaterThanOrEqual(RANDSUM_MODIFIERS.length)
    })
  })

  describe('parseModifiers', () => {
    test('parses drop modifier notation', () => {
      const result = parseModifiers('4d6L')
      expect(result.drop).toEqual({ lowest: 1 })
    })

    test('parses keep modifier notation', () => {
      const result = parseModifiers('4d6K3')
      expect(result.keep).toEqual({ highest: 3 })
    })

    test('parses plus modifier notation', () => {
      const result = parseModifiers('2d6+5')
      expect(result.plus).toBe(5)
    })

    test('parses minus modifier notation', () => {
      const result = parseModifiers('2d6-3')
      expect(result.minus).toBe(3)
    })

    test('parses explode modifier notation', () => {
      const result = parseModifiers('3d6!')
      expect(result.explode).toBe(true)
    })

    test('parses reroll modifier notation', () => {
      const result = parseModifiers('4d6R{1}')
      expect(result.reroll).toBeDefined()
    })

    test('parses unique modifier notation', () => {
      const result = parseModifiers('4d6U')
      expect(result.unique).toBe(true)
    })

    test('parses cap modifier notation', () => {
      const result = parseModifiers('4d6C{<2}')
      expect(result.cap).toBeDefined()
    })

    test('parses count successes sugar notation S{N}', () => {
      const result = parseModifiers('4d6S{5}')
      expect(result.count).toEqual({ greaterThanOrEqual: 5 })
    })

    test('parses count failures sugar notation F{N}', () => {
      const result = parseModifiers('4d6F{2}')
      expect(result.count).toEqual({ lessThanOrEqual: 2 })
    })

    test('parses count notation #{...}', () => {
      const result = parseModifiers('4d6#{>3}')
      expect(result.count).toBeDefined()
    })

    test('parses integer divide modifier', () => {
      const result = parseModifiers('4d6//2')
      expect(result.integerDivide).toBe(2)
    })

    test('parses modulo modifier', () => {
      const result = parseModifiers('4d6%3')
      expect(result.modulo).toBe(3)
    })

    test('parses sort modifier ascending', () => {
      const result = parseModifiers('4d6sa')
      expect(result.sort).toBe('asc')
    })

    test('parses wildDie modifier', () => {
      const result = parseModifiers('5d6W')
      expect(result.wildDie).toBe(true)
    })

    test('returns empty object for notation with no modifiers', () => {
      const result = parseModifiers('4d6')
      expect(result).toEqual({})
    })

    test('parses multiple modifiers in single notation', () => {
      const result = parseModifiers('4d6L+5')
      expect(result.drop).toEqual({ lowest: 1 })
      expect(result.plus).toBe(5)
    })

    test('preprocesses margin-of-success sugar to minus modifier', () => {
      const result = parseModifiers('4d6ms{3}')
      expect(result.minus).toBe(3)
    })
  })
})

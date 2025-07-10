import { describe, expect, test } from 'bun:test'
import { rollBlades } from '../src/rollBlades'

describe('roll', () => {
  describe('return type', () => {
    test('returns a tuple of [BladesResult, NumericRollResult]', () => {
      const { outcome, result } = rollBlades(2)
      expect(typeof outcome).toBe('string')
      expect(['critical', 'success', 'partial', 'failure']).toContain(outcome)
      expect(result).toHaveProperty('total')
    })
  })

  describe('dice pool sizes', () => {
    test('handles single die (desperate position)', () => {
      const { outcome, result } = rollBlades(1)
      expect(['success', 'partial', 'failure']).toContain(outcome)
      expect(result.history.initialRolls).toHaveLength(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })

    test('handles two dice (risky position)', () => {
      const { outcome, result } = rollBlades(2)
      expect(['critical', 'success', 'partial', 'failure']).toContain(outcome)
      expect(result.history.initialRolls).toHaveLength(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeLessThanOrEqual(12)
    })

    test('handles three dice (controlled position)', () => {
      const { outcome, result } = rollBlades(3)
      expect(['critical', 'success', 'partial', 'failure']).toContain(outcome)
      expect(result.history.initialRolls).toHaveLength(3)
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeLessThanOrEqual(18)
    })
  })

  describe('outcome interpretation', () => {
    const loops = 100

    test('returns consistent results across multiple rolls', () => {
      const results = Array.from({ length: loops }, () => rollBlades(2))

      results.forEach(({ outcome, result }) => {
        expect(['critical', 'success', 'partial', 'failure']).toContain(outcome)
        expect(result.history.initialRolls).toHaveLength(2)
        expect(result.total).toBeGreaterThanOrEqual(2)
        expect(result.total).toBeLessThanOrEqual(12)
      })
    })
  })
})

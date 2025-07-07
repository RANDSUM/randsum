import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'

describe('roll', () => {
  describe('return type', () => {
    test('returns a tuple of [BladesResult, NumericRollResult]', () => {
      const [result, details] = roll(2)
      expect(typeof result).toBe('string')
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(details).toHaveProperty('total')
    })
  })

  describe('dice pool sizes', () => {
    test('handles single die (desperate position)', () => {
      const [result, details] = roll(1)
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(details.history.initialRolls).toHaveLength(1)
      expect(details.total).toBeGreaterThanOrEqual(1)
      expect(details.total).toBeLessThanOrEqual(6)
    })

    test('handles two dice (risky position)', () => {
      const [result, details] = roll(2)
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(details.history.initialRolls).toHaveLength(2)
      expect(details.total).toBeGreaterThanOrEqual(2)
      expect(details.total).toBeLessThanOrEqual(12)
    })

    test('handles three dice (controlled position)', () => {
      const [result, details] = roll(3)
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(details.history.initialRolls).toHaveLength(3)
      expect(details.total).toBeGreaterThanOrEqual(3)
      expect(details.total).toBeLessThanOrEqual(18)
    })
  })

  describe('result interpretation', () => {
    const loops = 100

    test('returns consistent results across multiple rolls', () => {
      const results = Array.from({ length: loops }, () => roll(2))

      results.forEach(([result, details]) => {
        expect(['critical', 'success', 'partial', 'failure']).toContain(result)
        expect(details.history.initialRolls).toHaveLength(2)
        expect(details.total).toBeGreaterThanOrEqual(2)
        expect(details.total).toBeLessThanOrEqual(12)
      })
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/games/blades'

describe('roll', () => {
  describe('dice pool sizes', () => {
    test('handles single die', () => {
      const { result, rolls } = roll({ rating: 1 })
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.initialRolls).toHaveLength(1)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(rolls[0]?.total).toBeLessThanOrEqual(6)
    })

    test('handles two dice', () => {
      const { result, rolls } = roll({ rating: 2 })
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.initialRolls).toHaveLength(2)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(rolls[0]?.total).toBeLessThanOrEqual(6)
    })

    test('handles three dice', () => {
      const { result, rolls } = roll({ rating: 3 })
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.initialRolls).toHaveLength(3)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(rolls[0]?.total).toBeLessThanOrEqual(6)
    })

    test('handles zero dice (desperate: 2d6 keep lowest)', () => {
      const { result, rolls } = roll({ rating: 0 })
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.initialRolls).toHaveLength(2)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(rolls[0]?.total).toBeLessThanOrEqual(6)
    })

    test('handles default input (same as rating 1)', () => {
      const { result, rolls } = roll()
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.initialRolls).toHaveLength(1)
    })
  })

  describe('result interpretation', () => {
    const loops = 100

    test('returns consistent result across multiple rolls', () => {
      const results = Array.from({ length: loops }, () => roll({ rating: 2 }))

      results.forEach(({ result, rolls }) => {
        expect(['critical', 'success', 'partial', 'failure']).toContain(result)
        expect(rolls[0]?.initialRolls).toHaveLength(2)
        expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
        expect(rolls[0]?.total).toBeLessThanOrEqual(6)
      })
    })

    test('zero dice never returns critical', () => {
      const results = Array.from({ length: loops }, () => roll({ rating: 0 }))
      results.forEach(({ result }) => {
        expect(['success', 'partial', 'failure']).toContain(result)
        expect(result).not.toBe('critical')
      })
    })
  })
})

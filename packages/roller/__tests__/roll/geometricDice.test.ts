import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

describe('Geometric dice (gN)', () => {
  describe('basic g6', () => {
    test('roll("g6") returns a positive integer', () => {
      const result = roll('g6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(result.total)).toBe(true)
    })

    test('roll("G6") is case-insensitive', () => {
      const result = roll('G6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(result.total)).toBe(true)
    })

    test('result has correct structure', () => {
      const result = roll('g6')
      expect(result.rolls).toHaveLength(1)
    })

    test('stress test: all values >= 1 and capped at 1000', () => {
      Array.from({ length: 999 }, () => roll('g6')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(1)
        expect(total).toBeLessThanOrEqual(1000)
      })
    })
  })

  describe('g2 (coin flip geometric)', () => {
    test('g2 returns at least 1', () => {
      const result = roll('g2')
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('stress test: g2 results vary (not all 1)', () => {
      const results = Array.from({ length: 999 }, () => roll('g2'))
      const totals = results.map(r => r.total)
      const uniqueTotals = new Set(totals)
      // With g2 (50% chance of 1 each roll), we should see at least some variety
      expect(uniqueTotals.size).toBeGreaterThan(1)
    })
  })

  describe('g20 (d20 geometric)', () => {
    test('g20 returns at least 1', () => {
      const result = roll('g20')
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('stress test: g20 tends to produce higher values than g2', () => {
      const g2Results = Array.from({ length: 500 }, () => roll('g2'))
      const g20Results = Array.from({ length: 500 }, () => roll('g20'))
      const g2Avg = g2Results.reduce((s, r) => s + r.total, 0) / g2Results.length
      const g20Avg = g20Results.reduce((s, r) => s + r.total, 0) / g20Results.length
      // g20 should on average take more rolls (1/20 chance of stopping vs 1/2)
      expect(g20Avg).toBeGreaterThan(g2Avg)
    })
  })

  describe('quantity prefix', () => {
    test('2g6 rolls two independent geometric dice', () => {
      const result = roll('2g6')
      expect(result.rolls).toHaveLength(1)
      // The quantity is 2, so there should be 2 roll values
      expect(result.rolls[0]!.rolls).toHaveLength(2)
    })

    test('3g6 rolls three independent geometric dice', () => {
      const result = roll('3g6')
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('stress test: each geometric die result >= 1', () => {
      Array.from({ length: 999 }, () => roll('2g6')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).toBeGreaterThanOrEqual(1)
          expect(die).toBeLessThanOrEqual(1000)
        })
      })
    })
  })

  describe('deterministic with seeded random', () => {
    test('produces same result with same seed', () => {
      const s1 = createSeededRandom(42)
      const s2 = createSeededRandom(42)
      const r1 = roll('g6', { randomFn: s1 })
      const r2 = roll('g6', { randomFn: s2 })
      expect(r1.total).toBe(r2.total)
    })
  })

  describe('mixed with other arguments', () => {
    test('g6 mixed with numeric argument', () => {
      const result = roll('g6', 6)
      expect(result.rolls).toHaveLength(2)
    })

    test('g6 mixed with notation', () => {
      const result = roll('g6', '2d6')
      expect(result.rolls).toHaveLength(2)
    })
  })
})

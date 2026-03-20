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

    test('rolls show actual die values ending with 1', () => {
      const result = roll('g6')
      const rolls = result.rolls[0]!.rolls
      expect(rolls.length).toBeGreaterThanOrEqual(1)
      // Last roll in a geometric sequence is always 1 (the stop condition)
      expect(rolls[rolls.length - 1]).toBe(1)
      // All rolls are valid d6 values
      rolls.forEach(die => {
        expect(die).toBeGreaterThanOrEqual(1)
        expect(die).toBeLessThanOrEqual(6)
      })
    })

    test('total is sum of all die values', () => {
      const result = roll('g6')
      const rolls = result.rolls[0]!.rolls
      const expectedTotal = rolls.reduce((sum, v) => sum + v, 0)
      expect(result.total).toBe(expectedTotal)
    })

    test('stress test: all sequences end with 1', () => {
      Array.from({ length: 999 }, () => roll('g6')).forEach(({ rolls: records }) => {
        const rolls = records[0]!.rolls
        expect(rolls[rolls.length - 1]).toBe(1)
      })
    })
  })

  describe('g2 (coin flip geometric)', () => {
    test('g2 returns at least 1', () => {
      const result = roll('g2')
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('stress test: g2 roll counts vary', () => {
      const results = Array.from({ length: 999 }, () => roll('g2'))
      const rollCounts = results.map(r => r.rolls[0]!.rolls.length)
      const uniqueCounts = new Set(rollCounts)
      expect(uniqueCounts.size).toBeGreaterThan(1)
    })
  })

  describe('g20 (d20 geometric)', () => {
    test('g20 returns at least 1', () => {
      const result = roll('g20')
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('stress test: g20 tends to produce more rolls than g2', () => {
      const g2Results = Array.from({ length: 500 }, () => roll('g2'))
      const g20Results = Array.from({ length: 500 }, () => roll('g20'))
      const g2AvgRolls =
        g2Results.reduce((s, r) => s + r.rolls[0]!.rolls.length, 0) / g2Results.length
      const g20AvgRolls =
        g20Results.reduce((s, r) => s + r.rolls[0]!.rolls.length, 0) / g20Results.length
      expect(g20AvgRolls).toBeGreaterThan(g2AvgRolls)
    })
  })

  describe('quantity prefix', () => {
    test('2g6 produces rolls from two independent geometric sequences', () => {
      const result = roll('2g6')
      expect(result.rolls).toHaveLength(1)
      const rolls = result.rolls[0]!.rolls
      // Should have at least 2 rolls (minimum 1 per sequence)
      expect(rolls.length).toBeGreaterThanOrEqual(2)
    })

    test('stress test: each die value in range', () => {
      Array.from({ length: 999 }, () => roll('2g6')).forEach(({ rolls: records }) => {
        records[0]!.rolls.forEach(die => {
          expect(die).toBeGreaterThanOrEqual(1)
          expect(die).toBeLessThanOrEqual(6)
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
      expect(r1.rolls[0]!.rolls).toEqual(r2.rolls[0]!.rolls)
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

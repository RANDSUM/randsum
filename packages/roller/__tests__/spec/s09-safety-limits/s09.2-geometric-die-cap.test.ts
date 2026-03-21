import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'

describe('S09.2 — Geometric Die Safety Cap', () => {
  describe('g1 — always-continuing geometric die', () => {
    // g1: die with sides=1 always rolls 1, which equals the max, so it
    // would loop forever without a safety cap. The pipeline caps at 1000 rolls.
    test('g1 terminates and returns a result', () => {
      const result = roll('g1')
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('g1 total is a positive integer', () => {
      const result = roll('g1')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(result.total)).toBe(true)
    })

    test('g1 roll count is capped (not infinite)', () => {
      const result = roll('g1')
      const rollCount = result.rolls[0]!.rolls.length
      // Safety cap is 1000 rolls per geometric sequence
      expect(rollCount).toBeLessThanOrEqual(1000)
      expect(rollCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('g6 — normal geometric die still terminates', () => {
    test('g6 terminates and returns a result', () => {
      const result = roll('g6')
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('g6 total is positive', () => {
      const result = roll('g6')
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('stress: 200 rolls of g6 all terminate', () => {
      Array.from({ length: 200 }, () => roll('g6')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
        expect(total).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('g2 — coin-flip geometric die terminates', () => {
    test('g2 terminates', () => {
      const result = roll('g2')
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('stress: 200 rolls of g2 all terminate', () => {
      Array.from({ length: 200 }, () => roll('g2')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
        expect(total).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

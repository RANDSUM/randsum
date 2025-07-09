import { describe, expect, test } from 'bun:test'
import { rollRoot } from '../src/rollRoot'

describe(rollRoot, () => {
  describe('return type', () => {
    test('returns a tuple of [RootResult, NumericRollResult]', () => {
      const { outcome, result } = rollRoot(0)
      expect(typeof outcome).toBe('string')
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(outcome)
      expect(result).toHaveProperty('total')
    })
  })

  describe('rollRoot ranges', () => {
    test('returns outcome within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const { result } = rollRoot(bonus)
      expect(result.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(result.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const { result } = rollRoot(0)
      expect(result.history.initialRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const { result } = rollRoot(bonus)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRoot) => sum + rollRoot,
        0
      )
      expect(result.total).toBe(rawTotal + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const { result } = rollRoot(bonus)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRoot) => sum + rollRoot,
        0
      )
      expect(result.total).toBe(rawTotal + bonus)
    })

    test('handles zero modifier', () => {
      const { result } = rollRoot(0)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRoot) => sum + rollRoot,
        0
      )
      expect(result.total).toBe(rawTotal)
    })
  })

  const loops = 9999
  describe('outcome interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: loops }, () => rollRoot(0))

      dummyArray.forEach(({ outcome, result }) => {
        if (outcome === 'Strong Hit') {
          expect(result.total).toBeGreaterThanOrEqual(10)
          return
        }

        if (outcome === 'Weak Hit') {
          expect(result.total).toBeGreaterThanOrEqual(7)
          expect(result.total).toBeLessThanOrEqual(9)
          return
        }

        expect(result.total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('edge cases', () => {
    test('handles extremely large positive modifiers', () => {
      const bonus = 1000
      const { outcome, result } = rollRoot(bonus)
      expect(outcome).toBe('Strong Hit')
      expect(result.total).toBeGreaterThan(1000)
    })

    test('handles extremely large negative modifiers', () => {
      const bonus = -1000
      const { outcome, result } = rollRoot(bonus)
      expect(outcome).toBe('Miss')
      expect(result.total).toBeLessThan(-980)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { rollRootRpg } from '../src/rollRootRpg'

describe(rollRootRpg, () => {
  describe('return type', () => {
    test('returns a tuple of [RootResult, RollResult]', () => {
      const { outcome, result } = rollRootRpg(0)
      expect(typeof outcome).toBe('string')
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(outcome)
      expect(result).toHaveProperty('total')
    })
  })

  describe('rollRootRpg ranges', () => {
    test('returns outcome within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const { result } = rollRootRpg(bonus)
      expect(result.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(result.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const { result } = rollRootRpg(0)
      expect(result.history.initialRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const { result } = rollRootRpg(bonus)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(result.total).toBe(rawTotal + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const { result } = rollRootRpg(bonus)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(result.total).toBe(rawTotal + bonus)
    })

    test('handles zero modifier', () => {
      const { result } = rollRootRpg(0)
      const rawTotal = result.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(result.total).toBe(rawTotal)
    })
  })

  const loops = 9999
  describe('outcome interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: loops }, () => rollRootRpg(0))

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
    test('throws error for extremely large positive modifiers', () => {
      const bonus = 1000
      expect(() => rollRootRpg(bonus)).toThrow(
        'Root RPG bonus is outside reasonable range (-20 to +20), received: 1000'
      )
    })

    test('throws error for extremely large negative modifiers', () => {
      const bonus = -1000
      expect(() => rollRootRpg(bonus)).toThrow(
        'Root RPG bonus is outside reasonable range (-20 to +20), received: -1000'
      )
    })

    test('handles maximum valid positive modifier', () => {
      const bonus = 20
      const { outcome, result } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(outcome)
      expect(result.total).toBeGreaterThanOrEqual(22) // 2d6 minimum (2) + 20
      expect(result.total).toBeLessThanOrEqual(32) // 2d6 maximum (12) + 20
    })

    test('handles maximum valid negative modifier', () => {
      const bonus = -20
      const { outcome, result } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(outcome)
      expect(result.total).toBeGreaterThanOrEqual(-18) // 2d6 minimum (2) - 20
      expect(result.total).toBeLessThanOrEqual(-8) // 2d6 maximum (12) - 20
    })

    test('throws error for NaN modifier', () => {
      expect(() => rollRootRpg(NaN)).toThrow(
        'Root RPG bonus must be a finite number, received: NaN'
      )
    })

    test('throws error for Infinity modifier', () => {
      expect(() => rollRootRpg(Infinity)).toThrow(
        'Root RPG bonus must be a finite number, received: Infinity'
      )
    })

    test('throws error for negative Infinity modifier', () => {
      expect(() => rollRootRpg(-Infinity)).toThrow(
        'Root RPG bonus must be a finite number, received: -Infinity'
      )
    })

    test('handles boundary values correctly', () => {
      // Test just inside the valid range
      expect(() => rollRootRpg(21)).toThrow(
        'Root RPG bonus is outside reasonable range'
      )
      expect(() => rollRootRpg(-21)).toThrow(
        'Root RPG bonus is outside reasonable range'
      )

      // Test exactly at the boundaries (should work)
      expect(() => rollRootRpg(20)).not.toThrow()
      expect(() => rollRootRpg(-20)).not.toThrow()
    })
  })
})

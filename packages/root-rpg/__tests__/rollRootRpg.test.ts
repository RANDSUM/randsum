import { describe, expect, test } from 'bun:test'
import { rollRootRpg } from '../src/rollRootRpg'

describe(rollRootRpg, () => {
  describe('return type', () => {
    test('returns BaseGameRollResult with details and details properties', () => {
      const rollResult = rollRootRpg(0)
      expect(rollResult).toHaveProperty('details')
      expect(rollResult).toHaveProperty('details')
      expect(typeof rollResult.result).toBe('string')
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(rollResult.result)
      expect(rollResult.details).toHaveProperty('total')
    })
  })

  describe('rollRootRpg ranges', () => {
    test('returns result within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const rollResult = rollRootRpg(bonus)
      expect(rollResult.details.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(rollResult.details.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const rollResult = rollRootRpg(0)
      expect(rollResult.details.history.initialRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const { details } = rollRootRpg(bonus)
      const rawTotal = details.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(details.total).toBe(rawTotal + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const { details } = rollRootRpg(bonus)
      const rawTotal = details.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(details.total).toBe(rawTotal + bonus)
    })

    test('handles zero modifier', () => {
      const { details } = rollRootRpg(0)
      const rawTotal = details.history.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(details.total).toBe(rawTotal)
    })
  })

  const loops = 9999
  describe('result interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: loops }, () => rollRootRpg(0))

      dummyArray.forEach((rollResult) => {
        if (rollResult.result === 'Strong Hit') {
          expect(rollResult.details.total).toBeGreaterThanOrEqual(10)
          return
        }

        if (rollResult.result === 'Weak Hit') {
          expect(rollResult.details.total).toBeGreaterThanOrEqual(7)
          expect(rollResult.details.total).toBeLessThanOrEqual(9)
          return
        }

        expect(rollResult.details.total).toBeLessThanOrEqual(6)
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
      const { result, details } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(details.total).toBeGreaterThanOrEqual(22) // 2d6 minimum (2) + 20
      expect(details.total).toBeLessThanOrEqual(32) // 2d6 maximum (12) + 20
    })

    test('handles maximum valid negative modifier', () => {
      const bonus = -20
      const { result, details } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(details.total).toBeGreaterThanOrEqual(-18) // 2d6 minimum (2) - 20
      expect(details.total).toBeLessThanOrEqual(-8) // 2d6 maximum (12) - 20
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
      expect(() => rollRootRpg(21)).toThrow(
        'Root RPG bonus is outside reasonable range'
      )
      expect(() => rollRootRpg(-21)).toThrow(
        'Root RPG bonus is outside reasonable range'
      )

      expect(() => rollRootRpg(20)).not.toThrow()
      expect(() => rollRootRpg(-20)).not.toThrow()
    })
  })
})

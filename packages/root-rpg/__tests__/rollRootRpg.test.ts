import { describe, expect, test } from 'bun:test'
import { rollRootRpg } from '../src/rollRootRpg'

describe('rollRootRpg', () => {
  describe('rollRootRpg ranges', () => {
    test('returns result within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const rollResult = rollRootRpg(bonus)
      expect(rollResult.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(rollResult.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const rollResult = rollRootRpg(0)
      expect(rollResult.rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const { rolls } = rollRootRpg(bonus)
      const rawTotal = rolls[0]?.modifierHistory.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(rolls[0]?.total).toBe(Number(rawTotal) + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const { rolls } = rollRootRpg(bonus)
      const rawTotal = rolls[0]?.modifierHistory.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(rolls[0]?.total).toBe(Number(rawTotal) + bonus)
    })

    test('handles zero modifier', () => {
      const { rolls } = rollRootRpg(0)
      const rawTotal = rolls[0]?.modifierHistory.initialRolls.reduce(
        (sum, rollRootRpg) => sum + rollRootRpg,
        0
      )
      expect(rolls[0]?.total).toBe(Number(rawTotal))
    })
  })

  const loops = 9999
  describe('result interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: loops }, () => rollRootRpg(0))

      dummyArray.forEach(({ result, total }) => {
        if (result === 'Strong Hit') {
          expect(total).toBeGreaterThanOrEqual(10)
          return
        }

        if (result === 'Weak Hit') {
          expect(total).toBeGreaterThanOrEqual(7)
          expect(total).toBeLessThanOrEqual(9)
          return
        }

        expect(total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('edge cases', () => {
    test('throws error for extremely large positive modifiers', () => {
      const bonus = 1000
      expect(() => rollRootRpg(bonus)).toThrow(
        'Root RPG bonus must be between -20 and 20, received: 1000'
      )
    })

    test('throws error for extremely large negative modifiers', () => {
      const bonus = -1000
      expect(() => rollRootRpg(bonus)).toThrow(
        'Root RPG bonus must be between -20 and 20, received: -1000'
      )
    })

    test('handles maximum valid positive modifier', () => {
      const bonus = 20
      const { result, total } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(total).toBeGreaterThanOrEqual(22) // 2d6 minimum (2) + 20
      expect(total).toBeLessThanOrEqual(32) // 2d6 maximum (12) + 20
    })

    test('handles maximum valid negative modifier', () => {
      const bonus = -20
      const { result, total } = rollRootRpg(bonus)
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(total).toBeGreaterThanOrEqual(-18) // 2d6 minimum (2) - 20
      expect(total).toBeLessThanOrEqual(-8) // 2d6 maximum (12) - 20
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
      expect(() => rollRootRpg(21)).toThrow('Root RPG bonus must be between -20 and 20')
      expect(() => rollRootRpg(-21)).toThrow('Root RPG bonus must be between -20 and 20')

      expect(() => rollRootRpg(20)).not.toThrow()
      expect(() => rollRootRpg(-20)).not.toThrow()
    })
  })
})

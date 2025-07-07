import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'

describe('roll', () => {
  describe('return type', () => {
    test('returns a tuple of [RootResult, NumericRollResult]', () => {
      const [result, details] = roll(0)
      expect(typeof result).toBe('string')
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(details).toHaveProperty('total')
    })
  })

  describe('roll ranges', () => {
    test('returns result within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const [, details] = roll(bonus)
      expect(details.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(details.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const [, details] = roll(0)
      expect(details.modifiedRolls.rawRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const [, details] = roll(bonus)
      const rawTotal = details.modifiedRolls.rawRolls.reduce(
        (sum, roll) => sum + roll,
        0
      )
      expect(details.total).toBe(rawTotal + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const [, details] = roll(bonus)
      const rawTotal = details.modifiedRolls.rawRolls.reduce(
        (sum, roll) => sum + roll,
        0
      )
      expect(details.total).toBe(rawTotal + bonus)
    })

    test('handles zero modifier', () => {
      const [, details] = roll(0)
      const rawTotal = details.modifiedRolls.rawRolls.reduce(
        (sum, roll) => sum + roll,
        0
      )
      expect(details.total).toBe(rawTotal)
    })
  })

  const loops = 9999
  describe('result interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: loops }, () => roll(0))

      dummyArray.forEach(([result, details]) => {
        if (result === 'Strong Hit') {
          expect(details.total).toBeGreaterThanOrEqual(10)
          return
        }

        if (result === 'Weak Hit') {
          expect(details.total).toBeGreaterThanOrEqual(7)
          expect(details.total).toBeLessThanOrEqual(9)
          return
        }

        expect(details.total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('edge cases', () => {
    test('handles extremely large positive modifiers', () => {
      const bonus = 1000
      const [result, details] = roll(bonus)
      expect(result).toBe('Strong Hit')
      expect(details.total).toBeGreaterThan(1000)
    })

    test('handles extremely large negative modifiers', () => {
      const bonus = -1000
      const [result, details] = roll(bonus)
      expect(result).toBe('Miss')
      expect(details.total).toBeLessThan(-980)
    })
  })
})

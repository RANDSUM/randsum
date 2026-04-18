import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('count modifier', () => {
  describe('via notation string #{...}', () => {
    test('5d10#{>=7} counts dice >= 7', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10#{>=7}', { randomFn: seeded })
      const expectedCount = result.rolls[0]!.rolls.filter(r => r >= 7).length
      expect(result.total).toBe(expectedCount)
    })

    test('5d10#{<=3} counts dice <= 3', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10#{<=3}', { randomFn: seeded })
      const expectedCount = result.rolls[0]!.rolls.filter(r => r <= 3).length
      expect(result.total).toBe(expectedCount)
    })

    test('5d10#{>=7,<=1} counts successes minus botches', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10#{>=7,<=1}', { randomFn: seeded })
      const successes = result.rolls[0]!.rolls.filter(r => r >= 7).length
      const botches = result.rolls[0]!.rolls.filter(r => r <= 1).length
      expect(result.total).toBe(successes - botches)
    })

    test('5d10#{>5} counts dice > 5', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10#{>5}', { randomFn: seeded })
      const expectedCount = result.rolls[0]!.rolls.filter(r => r > 5).length
      expect(result.total).toBe(expectedCount)
    })

    test('5d10#{<2} counts dice < 2', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10#{<2}', { randomFn: seeded })
      const expectedCount = result.rolls[0]!.rolls.filter(r => r < 2).length
      expect(result.total).toBe(expectedCount)
    })

    test('5d6#{=6} counts exact 6s', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d6#{=6}', { randomFn: seeded })
      const expectedCount = result.rolls[0]!.rolls.filter(r => r === 6).length
      expect(result.total).toBe(expectedCount)
    })
  })

  describe('via options object', () => {
    test('count with greaterThanOrEqual', () => {
      const seeded = createSeededRandom(42)
      const result = roll(
        { sides: 10, quantity: 5, modifiers: { count: { greaterThanOrEqual: 7 } } },
        { randomFn: seeded }
      )
      const expectedCount = result.rolls[0]!.rolls.filter(r => r >= 7).length
      expect(result.total).toBe(expectedCount)
    })

    test('count with lessThanOrEqual', () => {
      const seeded = createSeededRandom(42)
      const result = roll(
        { sides: 10, quantity: 5, modifiers: { count: { lessThanOrEqual: 3 } } },
        { randomFn: seeded }
      )
      const expectedCount = result.rolls[0]!.rolls.filter(r => r <= 3).length
      expect(result.total).toBe(expectedCount)
    })

    test('count with deduct subtracts below from above', () => {
      const seeded = createSeededRandom(42)
      const result = roll(
        {
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true } }
        },
        { randomFn: seeded }
      )
      const successes = result.rolls[0]!.rolls.filter(r => r >= 7).length
      const botches = result.rolls[0]!.rolls.filter(r => r <= 1).length
      expect(result.total).toBe(successes - botches)
    })

    test('count with exact values', () => {
      const seeded = createSeededRandom(42)
      const result = roll(
        { sides: 6, quantity: 5, modifiers: { count: { exact: [6] } } },
        { randomFn: seeded }
      )
      const expectedCount = result.rolls[0]!.rolls.filter(r => r === 6).length
      expect(result.total).toBe(expectedCount)
    })
  })

  describe('S{} sugar still works via count', () => {
    test('5d10S{7} counts successes', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10S{7}'))
      results.forEach(r => {
        const successCount = r.rolls[0]!.rolls.filter(die => die >= 7).length
        expect(r.total).toBe(successCount)
      })
    })

    test('5d10S{7,1} counts successes minus botches', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10S{7,1}'))
      results.forEach(r => {
        const successes = r.rolls[0]!.rolls.filter(die => die >= 7).length
        const botches = r.rolls[0]!.rolls.filter(die => die <= 1).length
        expect(r.total).toBe(successes - botches)
      })
    })

    test('case insensitive: 5d10s{7}', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10s{7}'))
      results.forEach(r => {
        const successCount = r.rolls[0]!.rolls.filter(die => die >= 7).length
        expect(r.total).toBe(successCount)
      })
    })
  })

  describe('F{} sugar still works via count', () => {
    test('5d10F{3} counts failures', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10F{3}'))
      results.forEach(r => {
        const failCount = r.rolls[0]!.rolls.filter(die => die <= 3).length
        expect(r.total).toBe(failCount)
      })
    })

    test('case insensitive: 5d10f{3}', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10f{3}'))
      results.forEach(r => {
        const failCount = r.rolls[0]!.rolls.filter(die => die <= 3).length
        expect(r.total).toBe(failCount)
      })
    })
  })

  describe('stress tests', () => {
    test('count total always in [0, quantity] for non-deduct', () => {
      Array.from({ length: STRESS_ITERATIONS }, () =>
        roll({ sides: 10, quantity: 5, modifiers: { count: { greaterThanOrEqual: 7 } } })
      ).forEach(r => {
        expect(r.total).toBeGreaterThanOrEqual(0)
        expect(r.total).toBeLessThanOrEqual(5)
      })
    })

    test('deduct count can be negative', () => {
      const results = Array.from({ length: STRESS_ITERATIONS }, () =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 10, lessThanOrEqual: 3, deduct: true } }
        })
      )
      const hasNegative = results.some(r => r.total < 0)
      const hasPositive = results.some(r => r.total > 0)
      // With threshold at 10, very few successes but many botches <= 3
      expect(hasNegative).toBe(true)
      // Some rolls could have a 10 success
      expect(hasPositive || results.every(r => r.total <= 0)).toBe(true)
    })
  })

  describe('duplicate count modifier rejection', () => {
    test('roll("4d6#{>=3}#{<=1}") throws ModifierError', () => {
      expect(() => roll('4d6#{>=3}#{<=1}')).toThrow()
    })

    test('isDiceNotation("4d6#{>=3}#{<=1}") returns false', async () => {
      const { isDiceNotation } = await import('../../src/notation/isDiceNotation')
      expect(isDiceNotation('4d6#{>=3}#{<=1}')).toBe(false)
    })

    test('single count modifier still works: roll("4d6#{>=3}")', () => {
      expect(() => roll('4d6#{>=3}')).not.toThrow()
    })
  })

  describe('deterministic with seeded random', () => {
    test('produces same result with same seed', () => {
      const s1 = createSeededRandom(123)
      const s2 = createSeededRandom(123)
      const r1 = roll('5d10#{>=7}', { randomFn: s1 })
      const r2 = roll('5d10#{>=7}', { randomFn: s2 })
      expect(r1.total).toBe(r2.total)
    })
  })
})

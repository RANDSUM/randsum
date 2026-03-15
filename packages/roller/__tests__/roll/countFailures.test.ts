import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

describe('countFailures modifier', () => {
  describe('via options object', () => {
    test('counts dice at or below threshold', () => {
      const seeded = createSeededRandom(42)
      const result = roll(
        { sides: 10, quantity: 5, modifiers: { countFailures: { threshold: 3 } } },
        { randomFn: seeded }
      )
      // Total should be the count of dice <= 3
      const expectedFailures = result.rolls[0]!.rolls.filter(r => r <= 3).length
      expect(result.total).toBe(expectedFailures)
    })

    test('returns 0 when no dice are at or below threshold', () => {
      // Use threshold 0 on d6 — no die can roll 0
      const results = Array.from({ length: 100 }, () =>
        roll({ sides: 6, quantity: 3, modifiers: { countFailures: { threshold: 0 } } })
      )
      results.forEach(r => {
        expect(r.total).toBe(0)
      })
    })

    test('counts all dice when threshold >= max face', () => {
      // threshold 6 on d6 — every die is a failure
      const results = Array.from({ length: 100 }, () =>
        roll({ sides: 6, quantity: 4, modifiers: { countFailures: { threshold: 6 } } })
      )
      results.forEach(r => {
        expect(r.total).toBe(4)
      })
    })

    test('stress test: failure count is always in [0, quantity]', () => {
      Array.from({ length: 9999 }, () =>
        roll({ sides: 10, quantity: 5, modifiers: { countFailures: { threshold: 3 } } })
      ).forEach(r => {
        expect(r.total).toBeGreaterThanOrEqual(0)
        expect(r.total).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('via notation string', () => {
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

  describe('deterministic with seeded random', () => {
    test('produces same result with same seed', () => {
      const s1 = createSeededRandom(123)
      const s2 = createSeededRandom(123)
      const r1 = roll(
        { sides: 10, quantity: 5, modifiers: { countFailures: { threshold: 3 } } },
        { randomFn: s1 }
      )
      const r2 = roll(
        { sides: 10, quantity: 5, modifiers: { countFailures: { threshold: 3 } } },
        { randomFn: s2 }
      )
      expect(r1.total).toBe(r2.total)
    })
  })
})

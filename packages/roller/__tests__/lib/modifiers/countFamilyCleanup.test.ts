/**
 * Story 9: Count-Family Resolution (Path A)
 *
 * Tests that:
 * 1. countSuccessesModifier and countFailuresModifier exports are gone
 * 2. S{N} and F{N} notation still works end-to-end through countBehavior
 * 3. Botch/threshold validate logic from countSuccessesBehavior is absorbed into countBehavior
 */
import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'

describe('count family cleanup (Story 9)', () => {
  describe('dead exports removed from definitions/index', () => {
    test('countSuccessesModifier is not exported from definitions', async () => {
      const definitions = await import('../../../src/modifiers/definitions')
      expect((definitions as Record<string, unknown>)['countSuccessesModifier']).toBeUndefined()
    })

    test('countFailuresModifier is not exported from definitions', async () => {
      const definitions = await import('../../../src/modifiers/definitions')
      expect((definitions as Record<string, unknown>)['countFailuresModifier']).toBeUndefined()
    })
  })

  describe('S{N} notation still works end-to-end', () => {
    test('S{5} parses and executes as count >= 5', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10S{5}', { randomFn: seeded })
      const expected = result.rolls[0]!.rolls.filter(r => r >= 5).length
      expect(result.total).toBe(expected)
    })

    test('S{7} counts successes as expected', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10S{7}'))
      results.forEach(r => {
        const successCount = r.rolls[0]!.rolls.filter(die => die >= 7).length
        expect(r.total).toBe(successCount)
      })
    })

    test('S{7,1} counts successes minus botches (deduct)', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10S{7,1}'))
      results.forEach(r => {
        const successes = r.rolls[0]!.rolls.filter(die => die >= 7).length
        const botches = r.rolls[0]!.rolls.filter(die => die <= 1).length
        expect(r.total).toBe(successes - botches)
      })
    })

    test('case insensitive: s{7}', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10s{7}'))
      results.forEach(r => {
        const successCount = r.rolls[0]!.rolls.filter(die => die >= 7).length
        expect(r.total).toBe(successCount)
      })
    })
  })

  describe('F{N} notation still works end-to-end', () => {
    test('F{3} parses and executes as count <= 3', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d10F{3}', { randomFn: seeded })
      const expected = result.rolls[0]!.rolls.filter(r => r <= 3).length
      expect(result.total).toBe(expected)
    })

    test('F{3} counts failures as expected', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10F{3}'))
      results.forEach(r => {
        const failCount = r.rolls[0]!.rolls.filter(die => die <= 3).length
        expect(r.total).toBe(failCount)
      })
    })

    test('case insensitive: f{3}', () => {
      const results = Array.from({ length: 100 }, () => roll('5d10f{3}'))
      results.forEach(r => {
        const failCount = r.rolls[0]!.rolls.filter(die => die <= 3).length
        expect(r.total).toBe(failCount)
      })
    })
  })

  describe('botch/threshold validate logic absorbed into countBehavior', () => {
    test('deduct with valid non-overlapping ranges does not throw', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true } }
        })
      ).not.toThrow()
    })

    test('deduct where botchThreshold >= threshold throws ModifierError', () => {
      // botchThreshold (lessThanOrEqual=5) >= threshold (greaterThanOrEqual=3) is invalid
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 3, lessThanOrEqual: 5, deduct: true } }
        })
      ).toThrow()
    })

    test('deduct where botchThreshold === threshold throws ModifierError', () => {
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 5, lessThanOrEqual: 5, deduct: true } }
        })
      ).toThrow()
    })

    test('non-deduct count with both thresholds does not throw', () => {
      // Without deduct, both conditions are additive — no validation needed
      expect(() =>
        roll({
          sides: 10,
          quantity: 5,
          modifiers: { count: { greaterThanOrEqual: 3, lessThanOrEqual: 5 } }
        })
      ).not.toThrow()
    })
  })
})

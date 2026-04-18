import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('Extended Modifier Integration Tests', () => {
  // ─── compound (!!) ──────────────────────────────────────────────────

  describe('compound (!!)', () => {
    describe('basic usage', () => {
      test('roll("3d6!!") returns a valid result', () => {
        const result = roll('3d6!!' as string)
        expect(result.total).toBeGreaterThanOrEqual(3)
        expect(typeof result.total).toBe('number')
      })

      test('roll("3d6!!") produces exactly 1 roll record', () => {
        const result = roll('3d6!!' as string)
        expect(result.rolls).toHaveLength(1)
      })

      test('compound preserves dice count (modifies values, does not add dice)', () => {
        const result = roll('3d6!!' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(3)
      })
    })

    describe('with depth limit', () => {
      test('roll("1d6!!5") compound with depth limit 5', () => {
        const result = roll('1d6!!5' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(1)
      })

      test('roll("1d6!!0") compound unlimited (capped at 1000)', () => {
        const result = roll('1d6!!0' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(1)
      })
    })

    describe('case insensitivity', () => {
      test('notation is case-insensitive for the core part', () => {
        const result = roll('3D6!!' as string)
        expect(result.total).toBeGreaterThanOrEqual(3)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(3)
      })
    })

    describe('with seeded random', () => {
      test('deterministic results with seeded random', () => {
        const seeded1 = createSeededRandom(42)
        const result1 = roll('3d6!!' as string, { randomFn: seeded1 })
        const seeded2 = createSeededRandom(42)
        const result2 = roll('3d6!!' as string, { randomFn: seeded2 })
        expect(result1.total).toBe(result2.total)
      })
    })

    describe('modifier log', () => {
      test('compound modifier appears in modifierLogs', () => {
        const result = roll('3d6!!' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.modifierLogs).toBeDefined()
        const compoundLog = record!.modifierLogs.find(
          (log: { modifier: string }) => log.modifier === 'compound'
        )
        expect(compoundLog).toBeDefined()
      })
    })

    describe('stress test', () => {
      test('3d6!! total always >= 3 (no zero/negative)', () => {
        const results = Array.from({ length: STRESS_ITERATIONS }, () => roll('3d6!!' as string))
        results.forEach(({ total }) => {
          expect(total).toBeGreaterThanOrEqual(3)
        })
      })

      test('3d6!! always has exactly 3 dice in the result', () => {
        const results = Array.from({ length: STRESS_ITERATIONS }, () => roll('3d6!!' as string))
        results.forEach(({ rolls }) => {
          const record = rolls[0]
          expect(record).toBeDefined()
          expect(record!.rolls).toHaveLength(3)
        })
      })
    })
  })

  // ─── penetrate (!p) ─────────────────────────────────────────────────

  describe('penetrate (!p)', () => {
    describe('basic usage', () => {
      test('roll("3d6!p") returns a valid result', () => {
        const result = roll('3d6!p' as string)
        expect(result.total).toBeGreaterThanOrEqual(3)
        expect(typeof result.total).toBe('number')
      })

      test('roll("3d6!p") produces exactly 1 roll record', () => {
        const result = roll('3d6!p' as string)
        expect(result.rolls).toHaveLength(1)
      })

      test('penetrate preserves dice count (modifies values, does not add dice)', () => {
        const result = roll('3d6!p' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(3)
      })
    })

    describe('with depth limit', () => {
      test('roll("1d6!p5") penetrate with depth limit 5', () => {
        const result = roll('1d6!p5' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(1)
      })

      test('roll("1d6!p0") penetrate unlimited (capped at 1000)', () => {
        const result = roll('1d6!p0' as string)
        expect(result.total).toBeGreaterThanOrEqual(1)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(1)
      })
    })

    describe('case insensitivity', () => {
      test('notation is case-insensitive for the core part', () => {
        const result = roll('3D6!p' as string)
        expect(result.total).toBeGreaterThanOrEqual(3)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(3)
      })

      test('"!P" uppercase P is accepted (case-insensitive)', () => {
        const result = roll('3d6!P' as string)
        expect(result.total).toBeGreaterThanOrEqual(3)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.rolls).toHaveLength(3)
      })
    })

    describe('with seeded random', () => {
      test('deterministic results with seeded random', () => {
        const seeded1 = createSeededRandom(42)
        const result1 = roll('3d6!p' as string, { randomFn: seeded1 })
        const seeded2 = createSeededRandom(42)
        const result2 = roll('3d6!p' as string, { randomFn: seeded2 })
        expect(result1.total).toBe(result2.total)
      })
    })

    describe('modifier log', () => {
      test('penetrate modifier appears in modifierLogs', () => {
        const result = roll('3d6!p' as string)
        const record = result.rolls[0]
        expect(record).toBeDefined()
        expect(record!.modifierLogs).toBeDefined()
        const penetrateLog = record!.modifierLogs.find(
          (log: { modifier: string }) => log.modifier === 'penetrate'
        )
        expect(penetrateLog).toBeDefined()
      })
    })

    describe('stress test', () => {
      test('3d6!p total always >= 3 (no zero/negative)', () => {
        const results = Array.from({ length: STRESS_ITERATIONS }, () => roll('3d6!p' as string))
        results.forEach(({ total }) => {
          expect(total).toBeGreaterThanOrEqual(3)
        })
      })

      test('3d6!p always has exactly 3 dice in the result', () => {
        const results = Array.from({ length: STRESS_ITERATIONS }, () => roll('3d6!p' as string))
        results.forEach(({ rolls }) => {
          const record = rolls[0]
          expect(record).toBeDefined()
          expect(record!.rolls).toHaveLength(3)
        })
      })
    })
  })

  // ─── Combined modifier scenarios ────────────────────────────────────

  describe('combined modifier scenarios', () => {
    test('compound with plus: roll("3d6!!+3")', () => {
      const result = roll('3d6!!+3' as string)
      expect(result.total).toBeGreaterThanOrEqual(6)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.rolls).toHaveLength(3)
    })

    test('penetrate with plus: roll("3d6!p+1")', () => {
      const result = roll('3d6!p+1' as string)
      expect(result.total).toBeGreaterThanOrEqual(4)
      const record = result.rolls[0]
      expect(record).toBeDefined()
      expect(record!.rolls).toHaveLength(3)
    })

    test('compound with multiply: roll("3d6!!*2+3")', () => {
      const result = roll('3d6!!*2+3' as string)
      expect(result.total).toBeGreaterThanOrEqual(9)
    })

    test('penetrate with drop lowest: roll("3d6!pL+1")', () => {
      const result = roll('3d6!pL+1' as string)
      expect(typeof result.total).toBe('number')
    })
  })
})

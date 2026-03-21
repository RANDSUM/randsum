import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'

describe('S10.2 — Level 2 VTT Baseline Conformance', () => {
  describe('R{condition} — reroll', () => {
    test('4d6R{1}: rerolled dice are no longer 1 (stress)', () => {
      Array.from({ length: 200 }, () => roll('4d6R{1}')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).not.toBe(1)
        })
      })
    })

    test('R{condition} result has valid shape', () => {
      const result = roll('4d6R{1}')
      expect(result.total).toBeGreaterThanOrEqual(4)
      expect(result.rolls[0]!.rolls).toHaveLength(4)
    })

    test('R{>5}: reroll anything above 5 on d6', () => {
      Array.from({ length: 200 }, () => roll('4d6R{>5}')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).toBeLessThanOrEqual(5)
        })
      })
    })

    test('R{<3}: reroll anything below 3', () => {
      Array.from({ length: 200 }, () => roll('4d6R{<3}')).forEach(({ rolls }) => {
        rolls[0]!.rolls.forEach(die => {
          expect(die).toBeGreaterThanOrEqual(3)
        })
      })
    })
  })

  describe('ro{condition} — reroll once', () => {
    test('ro{1} parses and returns valid result', () => {
      const result = roll('4d6ro{1}')
      expect(result.total).toBeGreaterThanOrEqual(4)
      expect(result.rolls[0]!.rolls).toHaveLength(4)
    })

    test('ro{1} equivalent to R{1}1 with same seed', () => {
      const s1 = createSeededRandom(99)
      const s2 = createSeededRandom(99)
      const r1 = roll('4d6ro{1}', { randomFn: s1 })
      const r2 = roll('4d6R{1}1', { randomFn: s2 })
      expect(r1.total).toBe(r2.total)
    })
  })

  describe('! — explode', () => {
    test('1d6!: result is defined and finite', () => {
      const result = roll('1d6!')
      expect(Number.isFinite(result.total)).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    test('3d6!: produces 1 roll record', () => {
      const result = roll('3d6!')
      expect(result.rolls).toHaveLength(1)
    })

    test('stress: 1d6! always terminates', () => {
      Array.from({ length: 200 }, () => roll('1d6!')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
      })
    })
  })

  describe('!{condition} — conditional explode', () => {
    test('4d6!{>4}: result is defined', () => {
      const result = roll('4d6!{>4}')
      expect(Number.isFinite(result.total)).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(4)
    })

    test('4d6!{>=6}: result is defined', () => {
      const result = roll('4d6!{>=6}')
      expect(Number.isFinite(result.total)).toBe(true)
    })

    test('stress: 4d6!{>4} always terminates', () => {
      Array.from({ length: 200 }, () => roll('4d6!{>4}')).forEach(({ total }) => {
        expect(Number.isFinite(total)).toBe(true)
      })
    })
  })

  describe('# — count successes (default)', () => {
    test('5d6#{>=5}: total in [0, 5]', () => {
      Array.from({ length: 200 }, () => roll('5d6#{>=5}')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(5)
      })
    })

    test('5d6#{>=5}: total matches manual count', () => {
      const seeded = createSeededRandom(42)
      const result = roll('5d6#{>=5}', { randomFn: seeded })
      const expected = result.rolls[0]!.rolls.filter(r => r >= 5).length
      expect(result.total).toBe(expected)
    })
  })

  describe('S{N} — count successes >=N', () => {
    test('5d10S{7}: counts dice >= 7', () => {
      Array.from({ length: 200 }, () => roll('5d10S{7}')).forEach(({ rolls, total }) => {
        const expected = rolls[0]!.rolls.filter(d => d >= 7).length
        expect(total).toBe(expected)
      })
    })

    test('5d10S{7}: total in [0, 5]', () => {
      Array.from({ length: 200 }, () => roll('5d10S{7}')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('F{N} — count failures <=N', () => {
    test('5d10F{3}: counts dice <= 3', () => {
      Array.from({ length: 200 }, () => roll('5d10F{3}')).forEach(({ rolls, total }) => {
        const expected = rolls[0]!.rolls.filter(d => d <= 3).length
        expect(total).toBe(expected)
      })
    })

    test('5d10F{3}: total in [0, 5]', () => {
      Array.from({ length: 200 }, () => roll('5d10F{3}')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('condition expressions', () => {
    test('{>5} condition works in count', () => {
      const seeded = createSeededRandom(7)
      const result = roll('5d10#{>5}', { randomFn: seeded })
      const expected = result.rolls[0]!.rolls.filter(r => r > 5).length
      expect(result.total).toBe(expected)
    })

    test('{<3} condition works in count', () => {
      const seeded = createSeededRandom(7)
      const result = roll('5d10#{<3}', { randomFn: seeded })
      const expected = result.rolls[0]!.rolls.filter(r => r < 3).length
      expect(result.total).toBe(expected)
    })

    test('{>=N,<=M} compound condition (success minus botch)', () => {
      const seeded = createSeededRandom(13)
      const result = roll('5d10#{>=8,<=1}', { randomFn: seeded })
      const successes = result.rolls[0]!.rolls.filter(r => r >= 8).length
      const botches = result.rolls[0]!.rolls.filter(r => r <= 1).length
      expect(result.total).toBe(successes - botches)
    })
  })
})

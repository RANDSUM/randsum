import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

const N = 10_000
const SEED = 42

function rollMany(
  notation: string,
  seed = SEED,
  n = N
): { mean: number; min: number; max: number; faces: Set<number> } {
  const rng = createSeededRandom(seed)
  const totals: number[] = []
  for (const _ of Array.from({ length: n })) {
    const r = roll(notation, { randomFn: rng })
    if (!r.error) totals.push(r.total)
  }
  const mean = totals.reduce((a, b) => a + b, 0) / totals.length
  return {
    mean,
    min: Math.min(...totals),
    max: Math.max(...totals),
    faces: new Set(totals)
  }
}

describe.skipIf(!process.env.CI)('distribution tests', () => {
  describe('NdX mean = N * (X+1) / 2', () => {
    const cases: [string, number][] = [
      ['1d6', 3.5],
      ['2d6', 7.0],
      ['1d20', 10.5],
      ['3d8', 13.5]
    ]

    for (const [notation, expected] of cases) {
      test(`${notation} mean ≈ ${expected}`, () => {
        const { mean } = rollMany(notation)
        expect(mean).toBeGreaterThan(expected - 0.2)
        expect(mean).toBeLessThan(expected + 0.2)
      })
    }
  })

  describe('drop lowest (L)', () => {
    test('4d6L mean is greater than 3d6 mean by at least 1', () => {
      const base = rollMany('3d6').mean
      const dropped = rollMany('4d6L').mean
      expect(dropped).toBeGreaterThan(base + 1.0)
    })

    test('4d6L mean is approximately 12.24', () => {
      const { mean } = rollMany('4d6L')
      expect(mean).toBeGreaterThan(11.8)
      expect(mean).toBeLessThan(12.7)
    })

    test('4d6L results stay within 3–18', () => {
      const { min, max } = rollMany('4d6L')
      expect(min).toBeGreaterThanOrEqual(3)
      expect(max).toBeLessThanOrEqual(18)
    })
  })

  describe('explode (!)', () => {
    test('1d6! mean exceeds plain 1d6 mean', () => {
      const base = rollMany('1d6').mean
      const exploded = rollMany('1d6!').mean
      expect(exploded).toBeGreaterThan(base)
    })

    test('1d6! mean is approximately 4.2', () => {
      // E[explode on d6] = 3.5 / (1 - 1/6) ≈ 4.2
      const { mean } = rollMany('1d6!')
      expect(mean).toBeGreaterThan(3.9)
      expect(mean).toBeLessThan(4.6)
    })

    test('1d6! max exceeds 6', () => {
      const { max } = rollMany('1d6!')
      expect(max).toBeGreaterThan(6)
    })
  })

  describe('reroll (R{<2})', () => {
    test('1d6R{<2} never produces 1', () => {
      const { faces } = rollMany('1d6R{<2}')
      expect(faces.has(1)).toBe(false)
    })

    test('1d6R{<2} still covers all other faces', () => {
      const { faces } = rollMany('1d6R{<2}')
      for (const v of [2, 3, 4, 5, 6]) {
        expect(faces.has(v)).toBe(true)
      }
    })

    test('1d6R{<2} min is at least 2', () => {
      const { min } = rollMany('1d6R{<2}')
      expect(min).toBeGreaterThanOrEqual(2)
    })

    test('1d6R{<2} mean is higher than plain 1d6 mean', () => {
      const base = rollMany('1d6').mean
      const rerolled = rollMany('1d6R{<2}').mean
      expect(rerolled).toBeGreaterThan(base)
    })
  })

  describe('keep highest (K)', () => {
    test('2d20K mean is greater than 1d20 mean', () => {
      // advantage: keep highest of 2d20 → mean ≈ 13.82
      const base = rollMany('1d20').mean
      const advantage = rollMany('2d20K').mean
      expect(advantage).toBeGreaterThan(base)
    })

    test('2d20K mean is approximately 13.82', () => {
      const { mean } = rollMany('2d20K')
      expect(mean).toBeGreaterThan(13.0)
      expect(mean).toBeLessThan(14.6)
    })
  })

  describe('arithmetic modifiers', () => {
    test('1d6+5 mean ≈ 8.5', () => {
      const { mean } = rollMany('1d6+5')
      expect(mean).toBeGreaterThan(8.2)
      expect(mean).toBeLessThan(8.8)
    })

    test('1d6+5 min is 6, max is 11', () => {
      const { min, max } = rollMany('1d6+5')
      expect(min).toBe(6)
      expect(max).toBe(11)
    })
  })
})

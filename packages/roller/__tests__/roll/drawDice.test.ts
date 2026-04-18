import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('Draw Die (DD)', () => {
  describe('basic DD notation', () => {
    test('roll("DD6") returns a value between 1 and 6', () => {
      const result = roll('DD6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })

    test('roll("DD6") produces exactly 1 roll', () => {
      const result = roll('DD6')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.initialRolls).toHaveLength(1)
    })

    test('stress test: DD6 always in [1, 6]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('DD6')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(1)
        expect(total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('case insensitivity', () => {
    test('roll("dd6") works', () => {
      const result = roll('dd6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })

    test('roll("Dd6") works', () => {
      const result = roll('Dd6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })

    test('roll("dD6") works', () => {
      const result = roll('dD6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })
  })

  describe('quantity prefix', () => {
    test('roll("3DD6") draws 3 values from [1..6]', () => {
      const result = roll('3DD6')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.initialRolls).toHaveLength(3)
    })

    test('3DD6 draws are all unique (within a single draw)', () => {
      // 3 draws from 6 sides — all must be unique
      Array.from({ length: STRESS_ITERATIONS }, () => roll('3DD6')).forEach(({ rolls }) => {
        const drawn = rolls[0]!.initialRolls
        const unique = new Set(drawn)
        expect(unique.size).toBe(drawn.length)
      })
    })

    test('3DD6 values are all in [1, 6]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('3DD6')).forEach(({ rolls }) => {
        for (const v of rolls[0]!.initialRolls) {
          expect(v).toBeGreaterThanOrEqual(1)
          expect(v).toBeLessThanOrEqual(6)
        }
      })
    })
  })

  describe('exhaustive draw (quantity === sides)', () => {
    test('6DD6 draws all 6 values, each exactly once', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('6DD6')).forEach(({ rolls }) => {
        const drawn = rolls[0]!.initialRolls
        expect(drawn).toHaveLength(6)
        const sorted = [...drawn].sort((a, b) => a - b)
        expect(sorted).toEqual([1, 2, 3, 4, 5, 6])
      })
    })
  })

  describe('overflow draw (quantity > sides)', () => {
    test('8DD6 draws 8 values — first 6 are a permutation, then 2 more from reshuffled pool', () => {
      Array.from({ length: 999 }, () => roll('8DD6')).forEach(({ rolls }) => {
        const drawn = rolls[0]!.initialRolls
        expect(drawn).toHaveLength(8)

        // First 6 must be a permutation of [1..6]
        const firstBatch = drawn.slice(0, 6)
        const sortedFirst = [...firstBatch].sort((a, b) => a - b)
        expect(sortedFirst).toEqual([1, 2, 3, 4, 5, 6])

        // Last 2 must be valid face values
        for (const v of drawn.slice(6)) {
          expect(v).toBeGreaterThanOrEqual(1)
          expect(v).toBeLessThanOrEqual(6)
        }
      })
    })

    test('12DD6 draws two complete sets of [1..6]', () => {
      Array.from({ length: 999 }, () => roll('12DD6')).forEach(({ rolls }) => {
        const drawn = rolls[0]!.initialRolls
        expect(drawn).toHaveLength(12)

        const firstBatch = drawn.slice(0, 6)
        const secondBatch = drawn.slice(6, 12)
        expect([...firstBatch].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6])
        expect([...secondBatch].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6])
      })
    })
  })

  describe('total calculation', () => {
    test('6DD6 total is always 21 (1+2+3+4+5+6)', () => {
      Array.from({ length: 999 }, () => roll('6DD6')).forEach(({ total }) => {
        expect(total).toBe(21)
      })
    })
  })

  describe('mixed with other arguments', () => {
    test('DD6 mixed with numeric argument', () => {
      const result = roll('DD6', 6)
      expect(result.rolls).toHaveLength(2)
    })

    test('DD6 mixed with notation', () => {
      const result = roll('DD6', '2d6')
      expect(result.rolls).toHaveLength(2)
    })
  })
})

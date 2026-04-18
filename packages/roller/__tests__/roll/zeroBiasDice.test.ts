import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('Zero-bias dice (zN)', () => {
  describe('basic z6', () => {
    test('roll("z6") returns a result in [0, 5]', () => {
      const result = roll('z6')
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(5)
    })

    test('roll("Z6") is case-insensitive', () => {
      const result = roll('Z6')
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(5)
    })

    test('result has correct structure', () => {
      const result = roll('z6')
      expect(result.rolls).toHaveLength(1)
    })

    test('stress test: all values in [0, 5]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('z6')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('z20', () => {
    test('roll("z20") returns a result in [0, 19]', () => {
      const result = roll('z20')
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(19)
    })

    test('stress test: all values in [0, 19]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('z20')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(19)
      })
    })
  })

  describe('NzS with quantity prefix', () => {
    test('roll("4z6") returns result in [0, 20]', () => {
      const result = roll('4z6')
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(20)
    })

    test('roll("4z6") has correct quantity', () => {
      const result = roll('4z6')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.rolls).toHaveLength(4)
    })

    test('stress test: 4z6 always in [0, 20]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('4z6')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(0)
        expect(total).toBeLessThanOrEqual(20)
      })
    })

    test('roll("2z10") returns result in [0, 18]', () => {
      const result = roll('2z10')
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(18)
    })
  })

  describe('z2 (coin flip 0-1)', () => {
    test('stress test: all values in [0, 1]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('z2')).forEach(({ total }) => {
        expect([0, 1]).toContain(total)
      })
    })
  })

  describe('mixed with other arguments', () => {
    test('z6 mixed with numeric argument', () => {
      const result = roll('z6', 6)
      expect(result.rolls).toHaveLength(2)
    })

    test('z6 mixed with notation', () => {
      const result = roll('4z6', '2d6')
      expect(result.rolls).toHaveLength(2)
    })

    test('z6 mixed with fate dice', () => {
      const result = roll('z6', 'dF')
      expect(result.rolls).toHaveLength(2)
    })
  })
})

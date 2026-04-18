import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('Fate/Fudge dice (dF)', () => {
  describe('basic dF', () => {
    test('roll("dF") returns a result in [-1, 1]', () => {
      const result = roll('dF')
      expect(result.total).toBeGreaterThanOrEqual(-1)
      expect(result.total).toBeLessThanOrEqual(1)
    })

    test('roll("DF") is case-insensitive', () => {
      const result = roll('DF')
      expect(result.total).toBeGreaterThanOrEqual(-1)
      expect(result.total).toBeLessThanOrEqual(1)
    })

    test('roll("dF.1") is equivalent to roll("dF")', () => {
      const result = roll('dF.1')
      expect(result.total).toBeGreaterThanOrEqual(-1)
      expect(result.total).toBeLessThanOrEqual(1)
    })

    test('result has correct structure', () => {
      const result = roll('dF')
      expect(result.rolls).toHaveLength(1)
    })

    test('stress test: all values in [-1, 1]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('dF')).forEach(({ total }) => {
        expect([-1, 0, 1]).toContain(total)
      })
    })
  })

  describe('NdF with quantity', () => {
    test('roll("4dF") returns result in [-4, 4]', () => {
      const result = roll('4dF')
      expect(result.total).toBeGreaterThanOrEqual(-4)
      expect(result.total).toBeLessThanOrEqual(4)
    })

    test('stress test: 4dF always in [-4, 4]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('4dF')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-4)
        expect(total).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('dF.2 extended Fudge', () => {
    test('roll("dF.2") returns result in [-2, 2]', () => {
      const result = roll('dF.2')
      expect(result.total).toBeGreaterThanOrEqual(-2)
      expect(result.total).toBeLessThanOrEqual(2)
    })

    test('roll("4dF.2") returns result in [-8, 8]', () => {
      const result = roll('4dF.2')
      expect(result.total).toBeGreaterThanOrEqual(-8)
      expect(result.total).toBeLessThanOrEqual(8)
    })

    test('stress test: dF.2 values in [-2, -1, 0, 1, 2]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('dF.2')).forEach(({ total }) => {
        expect([-2, -1, 0, 1, 2]).toContain(total)
      })
    })

    test('stress test: 4dF.2 always in [-8, 8]', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => roll('4dF.2')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-8)
        expect(total).toBeLessThanOrEqual(8)
      })
    })
  })

  describe('mixed with other arguments', () => {
    test('dF mixed with numeric argument', () => {
      const result = roll('dF', 6)
      expect(result.rolls).toHaveLength(2)
    })

    test('dF mixed with notation', () => {
      const result = roll('4dF', '2d6')
      expect(result.rolls).toHaveLength(2)
    })

    test('multiple dF arguments', () => {
      const result = roll('dF', 'dF', 'dF', 'dF')
      expect(result.rolls).toHaveLength(4)
      expect(result.total).toBeGreaterThanOrEqual(-4)
      expect(result.total).toBeLessThanOrEqual(4)
    })
  })
})

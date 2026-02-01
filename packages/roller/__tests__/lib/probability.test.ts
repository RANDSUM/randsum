import { describe, expect, test } from 'bun:test'
import { analyze } from '../../src/lib/probability'

describe('analyze', () => {
  describe('basic dice analysis', () => {
    test('analyzes 1d6 correctly', () => {
      const result = analyze('1d6', 10000)

      expect(result.min).toBe(1)
      expect(result.max).toBe(6)
      // Mean should be close to 3.5, allow wider tolerance for Monte Carlo
      expect(result.mean).toBeGreaterThan(3.0)
      expect(result.mean).toBeLessThan(4.0)
      expect(result.median).toBeGreaterThanOrEqual(3)
      expect(result.median).toBeLessThanOrEqual(4)
      expect(result.standardDeviation).toBeGreaterThan(0)
      expect(result.distribution.size).toBeGreaterThan(0)
    })

    test('analyzes 2d6 correctly', () => {
      const result = analyze('2d6', 10000)

      expect(result.min).toBe(2)
      expect(result.max).toBe(12)
      // Mean should be close to 7
      expect(result.mean).toBeGreaterThan(6.5)
      expect(result.mean).toBeLessThan(7.5)
      // Mode for 2d6 should be 7 (most likely sum)
      expect(result.mode).toBe(7)
    })

    test('analyzes 1d20 correctly', () => {
      const result = analyze('1d20', 10000)

      expect(result.min).toBe(1)
      expect(result.max).toBe(20)
      // Mean should be close to 10.5
      expect(result.mean).toBeGreaterThan(10.0)
      expect(result.mean).toBeLessThan(11.0)
    })
  })

  describe('with modifiers', () => {
    test('analyzes 4d6L (drop lowest) correctly', () => {
      const result = analyze('4d6L', 10000)

      // 4d6 drop lowest: min is 3 (1+1+1), max is 18 (6+6+6)
      expect(result.min).toBeGreaterThanOrEqual(3)
      expect(result.max).toBeLessThanOrEqual(18)
      // Mean for 4d6L is approximately 12.24, allow wider tolerance
      expect(result.mean).toBeGreaterThan(11.5)
      expect(result.mean).toBeLessThan(13.0)
    })

    test('analyzes 2d20L (advantage - drop lowest) correctly', () => {
      const result = analyze('2d20L', 10000)

      // Advantage: drop lowest of 2d20, keep highest
      expect(result.min).toBeGreaterThanOrEqual(1)
      expect(result.max).toBeLessThanOrEqual(20)
      // Mean for advantage is approximately 13.82, allow wider tolerance
      expect(result.mean).toBeGreaterThan(13.0)
      expect(result.mean).toBeLessThan(15.0)
    })

    test('analyzes notation with plus modifier', () => {
      const result = analyze('1d6+5', 10000)

      expect(result.min).toBe(6)
      expect(result.max).toBe(11)
      // Mean should be close to 8.5
      expect(result.mean).toBeGreaterThan(8.0)
      expect(result.mean).toBeLessThan(9.0)
    })
  })

  describe('distribution properties', () => {
    test('distribution probabilities sum to approximately 1', () => {
      const result = analyze('2d6', 10000)

      const totalProbability = Array.from(result.distribution.values()).reduce(
        (sum, prob) => sum + prob,
        0
      )

      expect(totalProbability).toBeCloseTo(1, 1)
    })

    test('distribution contains all rolled values', () => {
      const result = analyze('1d6', 10000)

      // All values 1-6 should be present
      Array.from({ length: 6 }, (_, idx) => idx + 1).forEach(i => {
        expect(result.distribution.has(i)).toBe(true)
        expect(result.distribution.get(i)).toBeGreaterThan(0)
      })
    })

    test('2d6 distribution peaks at 7', () => {
      const result = analyze('2d6', 10000)

      const prob7 = result.distribution.get(7) ?? 0
      const prob2 = result.distribution.get(2) ?? 0
      const prob12 = result.distribution.get(12) ?? 0

      // 7 should be more likely than 2 or 12
      expect(prob7).toBeGreaterThan(prob2)
      expect(prob7).toBeGreaterThan(prob12)
    })
  })

  describe('statistical properties', () => {
    test('standard deviation is positive for random dice', () => {
      const result = analyze('3d6', 10000)
      expect(result.standardDeviation).toBeGreaterThan(0)
    })

    test('median is close to mean for symmetric distributions', () => {
      const result = analyze('2d6', 10000)
      // For 2d6, mean and median should both be around 7
      expect(Math.abs(result.mean - result.median)).toBeLessThan(0.5)
    })
  })

  describe('sample size parameter', () => {
    test('works with small sample size', () => {
      const result = analyze('1d6', 100)

      expect(result.min).toBeGreaterThanOrEqual(1)
      expect(result.max).toBeLessThanOrEqual(6)
      expect(result.distribution.size).toBeGreaterThan(0)
    })

    test('larger sample size produces more stable results', () => {
      const result1 = analyze('1d6', 1000)
      const result2 = analyze('1d6', 50000)

      // Both should have mean close to 3.5, but larger sample should be closer
      const diff1 = Math.abs(result1.mean - 3.5)
      const diff2 = Math.abs(result2.mean - 3.5)

      // This is probabilistic, but larger samples should generally be closer
      // We just verify both are reasonable
      expect(diff1).toBeLessThan(0.5)
      expect(diff2).toBeLessThan(0.2)
    })
  })
})

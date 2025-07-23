import { describe, expect, test } from 'bun:test'
import { coreRandom } from '../../src/lib/random'

describe('coreRandom', () => {
  describe('basic functionality', () => {
    test('returns a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const result = coreRandom(6)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('handles edge case with max value of 1', () => {
      for (let i = 0; i < 100; i++) {
        const result = coreRandom(1)
        expect(result).toBe(0)
      }
    })

    test('handles edge case with max value of 0', () => {
      const result = coreRandom(0)
      expect(result).toBe(0)
    })

    test('handles large max values', () => {
      const largeMax = 1000000
      for (let i = 0; i < 100; i++) {
        const result = coreRandom(largeMax)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(largeMax)
        expect(Number.isInteger(result)).toBe(true)
      }
    })
  })

  describe('boundary conditions', () => {
    test('handles negative max values', () => {
      const result = coreRandom(-5)
      expect(Number.isInteger(result)).toBe(true)
    })

    test('handles fractional max values', () => {
      for (let i = 0; i < 100; i++) {
        const result = coreRandom(6.7)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6.7)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('handles very small positive max values', () => {
      const result = coreRandom(0.1)
      expect(result).toBe(0)
    })
  })

  describe('distribution validation', () => {
    test('produces reasonably uniform distribution for d6', () => {
      const counts = new Array(6).fill(0)
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        const result = coreRandom(6)
        counts[result]++
      }

      const expectedCount = iterations / 6
      const tolerance = expectedCount * 0.1

      counts.forEach((count) => {
        expect(count).toBeGreaterThan(expectedCount - tolerance)
        expect(count).toBeLessThan(expectedCount + tolerance)
      })
    })

    test('produces reasonably uniform distribution for d20', () => {
      const counts = new Array(20).fill(0)
      const iterations = 20000

      for (let i = 0; i < iterations; i++) {
        const result = coreRandom(20)
        counts[result]++
      }

      const expectedCount = iterations / 20
      const tolerance = expectedCount * 0.15

      counts.forEach((count) => {
        expect(count).toBeGreaterThan(expectedCount - tolerance)
        expect(count).toBeLessThan(expectedCount + tolerance)
      })
    })
  })

  describe('performance characteristics', () => {
    test('performs efficiently with many calls', () => {
      const iterations = 100000
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        coreRandom(20)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })
  })
})

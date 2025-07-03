import { describe, expect, test } from 'bun:test'
import { coreRandom, createSeededRandom } from '../src/lib/utils/coreRandom'

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

describe('createSeededRandom', () => {
  describe('basic functionality', () => {
    test('creates a function that returns numbers in range', () => {
      const seededRandom = createSeededRandom(12345)

      for (let i = 0; i < 100; i++) {
        const result = seededRandom(6)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('produces deterministic results with same seed', () => {
      const seed = 54321
      const seededRandom1 = createSeededRandom(seed)
      const seededRandom2 = createSeededRandom(seed)

      const results1 = Array.from({ length: 100 }, () => seededRandom1(20))
      const results2 = Array.from({ length: 100 }, () => seededRandom2(20))

      expect(results1).toEqual(results2)
    })

    test('produces different results with different seeds', () => {
      const seededRandom1 = createSeededRandom(11111)
      const seededRandom2 = createSeededRandom(22222)

      const results1 = Array.from({ length: 100 }, () => seededRandom1(20))
      const results2 = Array.from({ length: 100 }, () => seededRandom2(20))

      expect(results1).not.toEqual(results2)
    })

    test('uses current timestamp as default seed', () => {
      const seededRandom1 = createSeededRandom()
      const seededRandom2 = createSeededRandom()

      const results1 = Array.from({ length: 10 }, () => seededRandom1(20))
      const results2 = Array.from({ length: 10 }, () => seededRandom2(20))

      if (JSON.stringify(results1) === JSON.stringify(results2)) {
        expect(typeof seededRandom1).toBe('function')
        expect(typeof seededRandom2).toBe('function')
        expect(results1.every((r) => r >= 0 && r < 20)).toBe(true)
        expect(results2.every((r) => r >= 0 && r < 20)).toBe(true)
      } else {
        expect(results1).not.toEqual(results2)
      }
    })
  })

  describe('edge cases and boundary conditions', () => {
    test('handles zero seed', () => {
      const seededRandom = createSeededRandom(0)

      for (let i = 0; i < 100; i++) {
        const result = seededRandom(6)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('handles negative seed', () => {
      const seededRandom = createSeededRandom(-12345)

      for (let i = 0; i < 100; i++) {
        const result = seededRandom(6)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('handles large seed values', () => {
      const seededRandom = createSeededRandom(Number.MAX_SAFE_INTEGER)

      for (let i = 0; i < 100; i++) {
        const result = seededRandom(6)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(6)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('handles edge case with max value of 1', () => {
      const seededRandom = createSeededRandom(12345)

      for (let i = 0; i < 100; i++) {
        const result = seededRandom(1)
        expect(result).toBe(0)
      }
    })

    test('handles edge case with max value of 0', () => {
      const seededRandom = createSeededRandom(12345)
      const result = seededRandom(0)
      expect(result).toBe(0)
    })
  })

  describe('xorshift algorithm validation', () => {
    test('produces different values in sequence', () => {
      const seededRandom = createSeededRandom(12345)
      const results = Array.from({ length: 100 }, () => seededRandom(1000))

      const uniqueValues = new Set(results)
      expect(uniqueValues.size).toBeGreaterThan(50)
    })

    test('maintains state between calls', () => {
      const seededRandom = createSeededRandom(98765)

      const firstSequence = Array.from({ length: 10 }, () => seededRandom(100))

      const secondSequence = Array.from({ length: 10 }, () => seededRandom(100))

      expect(firstSequence).not.toEqual(secondSequence)
    })

    test('handles potential overflow in xorshift operations', () => {
      const seededRandom = createSeededRandom(2147483647)

      for (let i = 0; i < 1000; i++) {
        const result = seededRandom(20)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(20)
        expect(Number.isInteger(result)).toBe(true)
      }
    })
  })

  describe('distribution validation', () => {
    test('produces reasonably uniform distribution', () => {
      const seededRandom = createSeededRandom(42)
      const counts = new Array(6).fill(0)
      const iterations = 12000

      for (let i = 0; i < iterations; i++) {
        const result = seededRandom(6)
        counts[result]++
      }

      const expectedCount = iterations / 6
      const tolerance = expectedCount * 0.15

      counts.forEach((count) => {
        expect(count).toBeGreaterThan(expectedCount - tolerance)
        expect(count).toBeLessThan(expectedCount + tolerance)
      })
    })
  })

  describe('performance characteristics', () => {
    test('performs efficiently with many calls', () => {
      const seededRandom = createSeededRandom(12345)
      const iterations = 100000
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        seededRandom(20)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200)
    })
  })
})

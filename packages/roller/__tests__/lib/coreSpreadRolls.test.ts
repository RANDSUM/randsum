import { describe, expect, test } from 'bun:test'
import { coreSpreadRolls } from '../../src/lib/random'

describe('coreSpreadRolls', () => {
  describe('basic functionality', () => {
    test('returns array of correct length', () => {
      const result = coreSpreadRolls(3, 6)
      expect(result).toHaveLength(3)
    })

    test('returns values within correct range for d6', () => {
      const result = coreSpreadRolls(100, 6)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(6)
      })
    })

    test('returns values within correct range for d20', () => {
      const result = coreSpreadRolls(50, 20)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(20)
      })
    })

    test('returns values within correct range for d100', () => {
      const result = coreSpreadRolls(25, 100)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('edge cases', () => {
    test('handles quantity of 0', () => {
      const result = coreSpreadRolls(0, 6)
      expect(result).toHaveLength(0)
      expect(result).toEqual([])
    })

    test('handles quantity of 1', () => {
      const result = coreSpreadRolls(1, 6)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeGreaterThanOrEqual(1)
      expect(result[0]).toBeLessThanOrEqual(6)
    })

    test('handles max value of 1 (coin flip)', () => {
      const result = coreSpreadRolls(10, 1)
      expect(result).toHaveLength(10)
      result.forEach((roll) => {
        expect(roll).toBe(1)
      })
    })

    test('handles max value of 2', () => {
      const result = coreSpreadRolls(20, 2)
      expect(result).toHaveLength(20)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(2)
      })
    })

    test('handles large quantity', () => {
      const result = coreSpreadRolls(1000, 6)
      expect(result).toHaveLength(1000)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(6)
      })
    })

    test('handles large max value', () => {
      const result = coreSpreadRolls(10, 1000)
      expect(result).toHaveLength(10)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(1000)
      })
    })
  })

  describe('boundary conditions', () => {
    test('handles fractional max values by flooring', () => {
      const result = coreSpreadRolls(10, 6.9)
      result.forEach((roll) => {
        expect(roll).toBeGreaterThanOrEqual(1)
        expect(roll).toBeLessThanOrEqual(7) // 6.9 + 1
      })
    })

    test('handles negative max values', () => {
      const result = coreSpreadRolls(5, -1)
      expect(result).toHaveLength(5)
    })

    test('handles zero max value', () => {
      const result = coreSpreadRolls(5, 0)
      expect(result).toHaveLength(5)
      result.forEach((roll) => {
        expect(roll).toBe(1) // 0 + 1 = 1
      })
    })
  })

  describe('performance characteristics', () => {
    test('performs efficiently with many calls', () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        coreSpreadRolls(10, 20)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })

    test('handles very large arrays efficiently', () => {
      const startTime = performance.now()

      const result = coreSpreadRolls(10000, 6)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result).toHaveLength(10000)
      expect(duration).toBeLessThan(50)
    })
  })
})

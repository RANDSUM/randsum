import { describe, expect, test } from 'bun:test'
import { calculateTotal } from '../../../src/roll/utils/calculateTotal'

describe('calculateTotal', () => {
  describe('basic functionality', () => {
    test('calculates sum of array without bonus', () => {
      const rolls = [1, 2, 3, 4]
      const result = calculateTotal(rolls)
      expect(result).toBe(10)
    })

    test('calculates sum of array with positive bonus', () => {
      const rolls = [2, 4, 6]
      const bonus = 5
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(17) // 2 + 4 + 6 + 5
    })

    test('calculates sum of array with negative bonus', () => {
      const rolls = [10, 5, 3]
      const bonus = -3
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(15) // 10 + 5 + 3 - 3
    })

    test('calculates sum of array with zero bonus', () => {
      const rolls = [1, 1, 1]
      const bonus = 0
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(3)
    })

    test('handles single element array', () => {
      const rolls = [7]
      const result = calculateTotal(rolls)
      expect(result).toBe(7)
    })

    test('handles single element array with bonus', () => {
      const rolls = [5]
      const bonus = 3
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(8)
    })
  })

  describe('edge cases', () => {
    test('handles empty array', () => {
      const rolls: number[] = []
      const result = calculateTotal(rolls)
      expect(result).toBe(0)
    })

    test('handles empty array with bonus', () => {
      const rolls: number[] = []
      const bonus = 10
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(10)
    })

    test('handles array with zeros', () => {
      const rolls = [0, 0, 0]
      const result = calculateTotal(rolls)
      expect(result).toBe(0)
    })

    test('handles array with zeros and bonus', () => {
      const rolls = [0, 0, 0]
      const bonus = 7
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(7)
    })

    test('handles negative numbers in array', () => {
      const rolls = [-1, -2, -3]
      const result = calculateTotal(rolls)
      expect(result).toBe(-6)
    })

    test('handles mixed positive and negative numbers', () => {
      const rolls = [5, -2, 3, -1]
      const result = calculateTotal(rolls)
      expect(result).toBe(5) // 5 - 2 + 3 - 1
    })

    test('handles mixed positive and negative numbers with bonus', () => {
      const rolls = [10, -5, 2]
      const bonus = -3
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(4) // 10 - 5 + 2 - 3
    })

    test('handles decimal numbers', () => {
      const rolls = [1.5, 2.5, 3.0]
      const result = calculateTotal(rolls)
      expect(result).toBe(7)
    })

    test('handles decimal numbers with decimal bonus', () => {
      const rolls = [1.25, 2.75]
      const bonus = 0.5
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(4.5)
    })

    test('handles very large numbers', () => {
      const rolls = [1000000, 2000000, 3000000]
      const bonus = 1000000
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(7000000)
    })

    test('handles very small decimal numbers', () => {
      const rolls = [0.001, 0.002, 0.003]
      const result = calculateTotal(rolls)
      expect(result).toBeCloseTo(0.006, 3)
    })
  })

  describe('special numeric values', () => {
    test('handles Infinity in array', () => {
      const rolls = [1, Infinity, 3]
      const result = calculateTotal(rolls)
      expect(result).toBe(Infinity)
    })

    test('handles -Infinity in array', () => {
      const rolls = [1, -Infinity, 3]
      const result = calculateTotal(rolls)
      expect(result).toBe(-Infinity)
    })

    test('handles NaN in array', () => {
      const rolls = [1, NaN, 3]
      const result = calculateTotal(rolls)
      expect(result).toBeNaN()
    })

    test('handles Infinity as bonus', () => {
      const rolls = [1, 2, 3]
      const bonus = Infinity
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(Infinity)
    })

    test('handles NaN as bonus', () => {
      const rolls = [1, 2, 3]
      const bonus = NaN
      const result = calculateTotal(rolls, bonus)
      expect(result).toBeNaN()
    })
  })

  describe('performance characteristics', () => {
    test('handles large arrays efficiently', () => {
      const rolls = Array.from({ length: 10000 }, (_, i) => i + 1)
      const startTime = performance.now()

      const result = calculateTotal(rolls)

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result).toBe(50005000) // Sum of 1 to 10000
      expect(duration).toBeLessThan(10) // Should be very fast
    })

    test('handles many calls efficiently', () => {
      const rolls = [1, 2, 3, 4, 5]
      const startTime = performance.now()

      for (let i = 0; i < 10000; i++) {
        calculateTotal(rolls, i)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Should complete quickly
    })
  })

  describe('mathematical properties', () => {
    test('addition is commutative for rolls', () => {
      const rolls1 = [1, 2, 3]
      const rolls2 = [3, 2, 1]

      expect(calculateTotal(rolls1)).toBe(calculateTotal(rolls2))
    })

    test('bonus addition is commutative', () => {
      const rolls = [1, 2, 3]
      const bonus = 5

      const result1 = calculateTotal(rolls, bonus)
      const result2 = calculateTotal([...rolls, bonus])

      expect(result1).toBe(result2)
    })

    test('zero bonus has no effect', () => {
      const rolls = [1, 2, 3, 4]

      expect(calculateTotal(rolls, 0)).toBe(calculateTotal(rolls))
    })

    test('negative bonus is equivalent to subtraction', () => {
      const rolls = [10, 5]
      const bonus = -3

      expect(calculateTotal(rolls, bonus)).toBe(calculateTotal(rolls) - 3)
    })
  })

  describe('real-world dice scenarios', () => {
    test('calculates d6 roll total', () => {
      const rolls = [3, 1, 6, 2] // 4d6
      const result = calculateTotal(rolls)
      expect(result).toBe(12)
    })

    test('calculates d20 roll with modifier', () => {
      const rolls = [15] // 1d20
      const modifier = 3
      const result = calculateTotal(rolls, modifier)
      expect(result).toBe(18)
    })

    test('calculates damage roll with bonus', () => {
      const rolls = [4, 2] // 2d6 damage
      const bonus = 2 // strength modifier
      const result = calculateTotal(rolls, bonus)
      expect(result).toBe(8)
    })

    test('calculates ability score generation', () => {
      const rolls = [6, 5, 4] // 4d6 drop lowest (1 was dropped)
      const result = calculateTotal(rolls)
      expect(result).toBe(15)
    })

    test('calculates critical hit damage', () => {
      const normalDamage = [3, 5] // 2d6
      const criticalDamage = [2, 4] // Additional 2d6
      const allRolls = [...normalDamage, ...criticalDamage]
      const modifier = 4

      const result = calculateTotal(allRolls, modifier)
      expect(result).toBe(18) // 3+5+2+4+4
    })
  })
})

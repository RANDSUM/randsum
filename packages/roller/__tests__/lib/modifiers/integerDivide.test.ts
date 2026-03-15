import { describe, expect, test } from 'bun:test'
import { integerDivideModifier } from '../../../src/lib/modifiers/definitions/integerDivide'

describe('integerDivideModifier', () => {
  describe('apply', () => {
    test('returns rolls unchanged', () => {
      const result = integerDivideModifier.apply([3, 4, 5], 2, {})
      expect(result.rolls).toEqual([3, 4, 5])
    })

    test('provides a total transformer that does integer division', () => {
      const result = integerDivideModifier.apply([3, 4, 5], 2, {})
      expect(result.transformTotal).toBeDefined()
      // total = 12, 12 // 2 = 6
      expect(result.transformTotal?.(12, [3, 4, 5])).toBe(6)
    })

    test('truncates toward zero for positive results', () => {
      const result = integerDivideModifier.apply([1], 3, {})
      // total = 7, 7 // 3 = 2 (truncated)
      expect(result.transformTotal?.(7, [1])).toBe(2)
    })

    test('truncates toward zero for negative results', () => {
      const result = integerDivideModifier.apply([1], 3, {})
      // total = -7, -7 // 3 = -2 (truncated toward zero)
      expect(result.transformTotal?.(-7, [1])).toBe(-2)
    })
  })

  describe('schema properties', () => {
    test('has name "integerDivide"', () => {
      expect(integerDivideModifier.name).toBe('integerDivide')
    })

    test('has priority 93', () => {
      expect(integerDivideModifier.priority).toBe(93)
    })
  })
})

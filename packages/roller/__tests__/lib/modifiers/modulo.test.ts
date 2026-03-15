import { describe, expect, test } from 'bun:test'
import { moduloModifier } from '../../../src/lib/modifiers/definitions/modulo'

describe('moduloModifier', () => {
  describe('apply', () => {
    test('returns rolls unchanged', () => {
      const result = moduloModifier.apply([3, 4, 5], 3, {})
      expect(result.rolls).toEqual([3, 4, 5])
    })

    test('provides a total transformer that does modulo', () => {
      const result = moduloModifier.apply([3, 4, 5], 3, {})
      expect(result.transformTotal).toBeDefined()
      // total = 12, 12 % 3 = 0
      expect(result.transformTotal?.(12, [3, 4, 5])).toBe(0)
    })

    test('modulo with remainder', () => {
      const result = moduloModifier.apply([1], 5, {})
      // total = 7, 7 % 5 = 2
      expect(result.transformTotal?.(7, [1])).toBe(2)
    })

    test('modulo with negative total preserves JS % behavior', () => {
      const result = moduloModifier.apply([1], 3, {})
      // total = -7, -7 % 3 = -1 in JS
      expect(result.transformTotal?.(-7, [1])).toBe(-1)
    })
  })

  describe('schema properties', () => {
    test('has name "modulo"', () => {
      expect(moduloModifier.name).toBe('modulo')
    })

    test('has priority 94', () => {
      expect(moduloModifier.priority).toBe(94)
    })
  })
})

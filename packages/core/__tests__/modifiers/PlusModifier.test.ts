import { describe, expect, test } from 'bun:test'
import { PlusModifier } from '../../src/modifiers/PlusModifier'
import type { NumericRollBonus } from '../../src/types'

describe('PlusModifier', () => {
  describe('static pattern', () => {
    test('matches plus notation correctly', () => {
      const pattern = PlusModifier.pattern

      expect('+1'.match(pattern)).not.toBeNull()
      expect('+20'.match(pattern)).not.toBeNull()
      expect('1d20+5'.match(pattern)).not.toBeNull()
      expect('2d6+10-2'.match(pattern)).not.toBeNull()

      expect('-1'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts plus value from notation', () => {
      const result = PlusModifier.parse('+5')
      expect(result).toEqual({ plus: 5 })
    })

    test('extracts plus value from complex notation', () => {
      const result = PlusModifier.parse('2d20+5L1')
      expect(result).toEqual({ plus: 5 })
    })

    test('combines multiple plus values', () => {
      const result = PlusModifier.parse('+5+3')
      expect(result).toEqual({ plus: 8 })
    })

    test('returns empty object when no plus notation found', () => {
      const result = PlusModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('adds value to simpleMathModifier', () => {
      const modifier = new PlusModifier(5)
      const bonus: NumericRollBonus = {
        rolls: [10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)
    })

    test('adds to existing simpleMathModifier', () => {
      const modifier = new PlusModifier(5)
      const bonus: NumericRollBonus = {
        rolls: [10, 15],
        simpleMathModifier: 3
      }

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new PlusModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })
})

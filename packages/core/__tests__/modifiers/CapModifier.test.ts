import { describe, expect, test } from 'bun:test'
import { CapModifier } from '../../src/modifiers/CapModifier'
import type { NumericRollBonus } from '../../src/types'

describe('CapModifier', () => {
  describe('static pattern', () => {
    test('matches cap notation correctly', () => {
      const pattern = CapModifier.pattern

      expect('C{>18}'.match(pattern)).not.toBeNull()
      expect('c{<3}'.match(pattern)).not.toBeNull()
      expect('C{>18,<3}'.match(pattern)).not.toBeNull()
      expect('2d20C{>18}'.match(pattern)).not.toBeNull()

      // Should not match these
      expect('C'.match(pattern)).toBeNull()
      expect('C18'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts greaterThan cap value', () => {
      const result = CapModifier.parse('C{>18}')
      expect(result).toEqual({ cap: { greaterThan: 18 } })
    })

    test('extracts lessThan cap value', () => {
      const result = CapModifier.parse('C{<3}')
      expect(result).toEqual({ cap: { lessThan: 3 } })
    })

    test('extracts both cap values', () => {
      const result = CapModifier.parse('C{>18,<3}')
      expect(result).toEqual({ cap: { greaterThan: 18, lessThan: 3 } })
    })

    test('handles multiple cap notations', () => {
      const result = CapModifier.parse('C{>18}C{<3}')
      expect(result).toEqual({ cap: { greaterThan: 18, lessThan: 3 } })
    })

    test('returns empty object when no cap notation found', () => {
      const result = CapModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('caps values greater than specified limit', () => {
      const modifier = new CapModifier({ greaterThan: 15 })
      const bonus: NumericRollBonus = {
        rolls: [10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])
    })

    test('caps values less than specified limit', () => {
      const modifier = new CapModifier({ lessThan: 15 })
      const bonus: NumericRollBonus = {
        rolls: [10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([15, 20])
    })

    test('caps values with both limits', () => {
      const modifier = new CapModifier({ greaterThan: 18, lessThan: 5 })
      const bonus: NumericRollBonus = {
        rolls: [3, 10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10, 18])
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new CapModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })
})

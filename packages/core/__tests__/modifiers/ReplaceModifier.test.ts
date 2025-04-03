import { describe, expect, test } from 'bun:test'
import { ReplaceModifier } from '../../src/modifiers/ReplaceModifier'
import type { NumericRollBonus } from '../../src/types'

describe('ReplaceModifier', () => {
  describe('static pattern', () => {
    test('matches replace notation correctly', () => {
      const pattern = ReplaceModifier.pattern

      expect('V{1=2}'.match(pattern)).not.toBeNull()
      expect('v{1=2}'.match(pattern)).not.toBeNull()
      expect('V{>18=20}'.match(pattern)).not.toBeNull()
      expect('V{<3=3}'.match(pattern)).not.toBeNull()
      expect('V{1=2,3=4}'.match(pattern)).not.toBeNull()
      expect('2d20V{1=20}'.match(pattern)).not.toBeNull()

      // Should not match these
      expect('V'.match(pattern)).toBeNull()
      expect('V1=2'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts exact replace value', () => {
      const result = ReplaceModifier.parse('V{1=2}')
      expect(result).toEqual({ replace: [{ from: 1, to: 2 }] })
    })

    test('extracts greaterThan replace value', () => {
      const result = ReplaceModifier.parse('V{>18=20}')
      expect(result).toEqual({
        replace: [{ from: { greaterThan: 18 }, to: 20 }]
      })
    })

    test('extracts lessThan replace value', () => {
      const result = ReplaceModifier.parse('V{<3=1}')
      expect(result).toEqual({ replace: [{ from: { lessThan: 3 }, to: 1 }] })
    })

    test('extracts multiple replace values', () => {
      const result = ReplaceModifier.parse('V{1=2,3=4}')
      expect(result).toEqual({
        replace: [
          { from: 1, to: 2 },
          { from: 3, to: 4 }
        ]
      })
    })

    test('returns empty object when no replace notation found', () => {
      const result = ReplaceModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('replaces exact values', () => {
      const modifier = new ReplaceModifier({ from: 1, to: 10 })
      const bonus: NumericRollBonus = {
        rolls: [1, 3, 1],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 3, 10])
    })

    test('replaces values greater than limit', () => {
      const modifier = new ReplaceModifier({
        from: { greaterThan: 15 },
        to: 15
      })
      const bonus: NumericRollBonus = {
        rolls: [10, 16, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15, 15])
    })

    test('replaces values less than limit', () => {
      const modifier = new ReplaceModifier({ from: { lessThan: 10 }, to: 10 })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 10, 15])
    })

    test('handles array of replace rules', () => {
      const modifier = new ReplaceModifier([
        { from: 1, to: 2 },
        { from: 20, to: 19 }
      ])
      const bonus: NumericRollBonus = {
        rolls: [1, 10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([2, 10, 19])
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new ReplaceModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [1, 10, 20],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })
})

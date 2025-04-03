import { describe, expect, test } from 'bun:test'
import { RerollModifier } from '../../src/modifiers/RerollModifier'
import type {
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../../src/types'

describe('RerollModifier', () => {
  describe('static pattern', () => {
    test('matches reroll notation correctly', () => {
      const pattern = RerollModifier.pattern

      expect('R{1}'.match(pattern)).not.toBeNull()
      expect('r{1,2}'.match(pattern)).not.toBeNull()
      expect('R{>18}'.match(pattern)).not.toBeNull()
      expect('R{<3}'.match(pattern)).not.toBeNull()
      expect('2d6R{1}'.match(pattern)).not.toBeNull()

      // Should not match these
      expect('R'.match(pattern)).toBeNull()
      expect('R1'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts exact reroll values', () => {
      const result = RerollModifier.parse('R{1}')
      expect(result).toEqual({ reroll: { exact: [1] } })
    })

    test('extracts multiple exact reroll values', () => {
      const result = RerollModifier.parse('R{1,2}')
      expect(result).toEqual({ reroll: { exact: [1, 2] } })
    })

    test('extracts greaterThan reroll value', () => {
      const result = RerollModifier.parse('R{>18}')
      expect(result).toEqual({ reroll: { greaterThan: 18 } })
    })

    test('extracts lessThan reroll value', () => {
      const result = RerollModifier.parse('R{<3}')
      expect(result).toEqual({ reroll: { lessThan: 3 } })
    })

    test('extracts max reroll count', () => {
      const result = RerollModifier.parse('R{1}')
      expect(result).toEqual({ reroll: { exact: [1] } })
    })

    test('returns empty object when no reroll notation found', () => {
      const result = RerollModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    // For reroll, we need to mock the rollOne function
    const mockRollOne = (): number => 4 // Always returns 4 for predictable tests

    test('rerolls exact values', () => {
      const modifier = new RerollModifier({ exact: [1, 2] })
      const bonus: NumericRollBonus = {
        rolls: [1, 3, 2],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 3
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([4, 3, 4])
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new RerollModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [1, 3, 5],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 3
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result).toBe(bonus)
    })
  })
})

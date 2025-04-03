import { describe, expect, test } from 'bun:test'
import { ExplodeModifier } from '../../src/modifiers/ExplodeModifier'
import type {
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../../src/types'

describe('ExplodeModifier', () => {
  describe('static pattern', () => {
    test('matches explode notation correctly', () => {
      const pattern = ExplodeModifier.pattern

      expect('!'.match(pattern)).not.toBeNull()
      expect('!{6}'.match(pattern)).not.toBeNull()
      expect('!{>5}'.match(pattern)).not.toBeNull()
      expect('!{<2}'.match(pattern)).not.toBeNull()
      expect('2d6!'.match(pattern)).not.toBeNull()

      expect('1d20'.match(pattern)).toBeNull()
      expect('2d6+1'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts basic explode value', () => {
      const result = ExplodeModifier.parse('!')
      expect(result).toEqual({ explode: true })
    })

    test('extracts complex explode notation but returns simple true', () => {
      const result = ExplodeModifier.parse('!{6}')
      expect(result).toEqual({ explode: true })
    })

    test('returns empty object when no explode notation found', () => {
      const result = ExplodeModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    const mockRollOne = (): number => 3

    test('adds additional rolls for maximum values', () => {
      const modifier = new ExplodeModifier(true)
      const bonus: NumericRollBonus = {
        rolls: [6, 4],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 2
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([6, 4, 3])
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new ExplodeModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [5, 6],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 2
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result).toBe(bonus)
    })
  })
})

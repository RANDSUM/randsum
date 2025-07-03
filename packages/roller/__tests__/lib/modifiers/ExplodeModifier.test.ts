import { describe, expect, test } from 'bun:test'
import { ExplodeModifier } from '../../../src/lib/modifiers/ExplodeModifier'
import {
  createMockRollOne,
  createNumericRollBonus,
  createRequiredNumericRollParameters
} from '../../support/fixtures'

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
    const mockRollOne = createMockRollOne(3)

    test('adds additional rolls for maximum values', () => {
      const modifier = new ExplodeModifier(true)
      const bonus = createNumericRollBonus({
        rolls: [6, 4]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 2
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([6, 4, 3])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'explode',
        options: true,
        added: [3],
        removed: []
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new ExplodeModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [5, 6]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 2
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for explode modifier', () => {
      const modifier = new ExplodeModifier(true)
      const result = modifier.toDescription()

      expect(result).toEqual(['Exploding Dice'])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new ExplodeModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for explode modifier', () => {
      const modifier = new ExplodeModifier(true)
      const result = modifier.toNotation()

      expect(result).toBe('!')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new ExplodeModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })
})

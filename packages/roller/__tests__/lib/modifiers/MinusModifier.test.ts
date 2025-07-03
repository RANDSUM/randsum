import { describe, expect, test } from 'bun:test'
import { MinusModifier } from '../../../src/lib'
import { createNumericRollBonus } from '../../support/fixtures'

describe('MinusModifier', () => {
  describe('static pattern', () => {
    test('matches minus notation correctly', () => {
      const pattern = MinusModifier.pattern

      expect('-1'.match(pattern)).not.toBeNull()
      expect('-20'.match(pattern)).not.toBeNull()
      expect('1d20-5'.match(pattern)).not.toBeNull()
      expect('2d6+10-2'.match(pattern)).not.toBeNull()

      expect('+1'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts minus value from notation', () => {
      const result = MinusModifier.parse('-5')
      expect(result).toEqual({ minus: 5 })
    })

    test('extracts minus value from complex notation', () => {
      const result = MinusModifier.parse('2d20-5L1')
      expect(result).toEqual({ minus: 5 })
    })

    test('combines multiple minus values', () => {
      const result = MinusModifier.parse('-5-3')
      expect(result).toEqual({ minus: 8 })
    })

    test('returns empty object when no minus notation found', () => {
      const result = MinusModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('subtracts value from simpleMathModifier', () => {
      const modifier = new MinusModifier(5)
      const bonus = createNumericRollBonus({
        rolls: [10, 15]
      })

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(-5)

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'minus',
        options: 5,
        added: [-5],
        removed: []
      })
    })

    test('subtracts from existing simpleMathModifier', () => {
      const modifier = new MinusModifier(5)
      const bonus = createNumericRollBonus({
        rolls: [10, 15],
        simpleMathModifier: 3
      })

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(-5)

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'minus',
        options: 5,
        added: [-5],
        removed: []
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new MinusModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [10, 15]
      })

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for minus modifier', () => {
      const modifier = new MinusModifier(3)
      const result = modifier.toDescription()

      expect(result).toEqual(['Subtract 3'])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new MinusModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for minus modifier', () => {
      const modifier = new MinusModifier(5)
      const result = modifier.toNotation()

      expect(result).toBe('-5')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new MinusModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })
})

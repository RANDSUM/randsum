import { describe, expect, test } from 'bun:test'
import { PlusModifier } from '../../../src/lib'
import { createNumericRollBonus } from '../../support/fixtures'

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
      const bonus = createNumericRollBonus({
        rolls: [10, 15]
      })

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'plus',
        options: 5,
        added: [5],
        removed: []
      })
    })

    test('adds to existing simpleMathModifier', () => {
      const modifier = new PlusModifier(5)
      const bonus = createNumericRollBonus({
        rolls: [10, 15],
        simpleMathModifier: 3
      })

      const result = modifier.apply(bonus)
      expect(result.simpleMathModifier).toBe(5)

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'plus',
        options: 5,
        added: [5],
        removed: []
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new PlusModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [10, 15]
      })

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for plus modifier', () => {
      const modifier = new PlusModifier(3)
      const result = modifier.toDescription()

      expect(result).toEqual(['Add 3'])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new PlusModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for plus modifier', () => {
      const modifier = new PlusModifier(5)
      const result = modifier.toNotation()

      expect(result).toBe('+5')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new PlusModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })
})

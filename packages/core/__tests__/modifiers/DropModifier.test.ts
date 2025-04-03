import { describe, expect, test } from 'bun:test'
import { DropModifier } from '../../src/modifiers/DropModifier'
import type { NumericRollBonus } from '../../src/types'

describe('DropModifier', () => {
  describe('static patterns', () => {
    test('matches drop highest notation correctly', () => {
      const pattern = DropModifier.highestPattern

      expect('H'.match(pattern)).not.toBeNull()
      expect('h'.match(pattern)).not.toBeNull()
      expect('H1'.match(pattern)).not.toBeNull()
      expect('h2'.match(pattern)).not.toBeNull()
      expect('2d20H1'.match(pattern)).not.toBeNull()

      expect('L'.match(pattern)).toBeNull()
      expect('D{1}'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })

    test('matches drop lowest notation correctly', () => {
      const pattern = DropModifier.lowestPattern

      expect('L'.match(pattern)).not.toBeNull()
      expect('l'.match(pattern)).not.toBeNull()
      expect('L1'.match(pattern)).not.toBeNull()
      expect('l2'.match(pattern)).not.toBeNull()
      expect('2d20L1'.match(pattern)).not.toBeNull()

      expect('H'.match(pattern)).toBeNull()
      expect('D{1}'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })

    test('matches drop constraints notation correctly', () => {
      const pattern = DropModifier.constraintsPattern

      expect('D{1}'.match(pattern)).not.toBeNull()
      expect('d{1}'.match(pattern)).not.toBeNull()
      expect('D{>18}'.match(pattern)).not.toBeNull()
      expect('D{<3}'.match(pattern)).not.toBeNull()
      expect('D{1,2,3}'.match(pattern)).not.toBeNull()

      expect('D'.match(pattern)).toBeNull()
      expect('L'.match(pattern)).toBeNull()
      expect('H'.match(pattern)).toBeNull()
      expect('1d20'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts lowest drop value', () => {
      const result = DropModifier.parse('L1')
      expect(result).toEqual({ drop: { lowest: 1 } })
    })

    test('extracts highest drop value', () => {
      const result = DropModifier.parse('H2')
      expect(result).toEqual({ drop: { highest: 2 } })
    })

    test('extracts exact drop values', () => {
      const result = DropModifier.parse('D{1,2,3}')
      expect(result).toEqual({ drop: { exact: [1, 2, 3] } })
    })

    test('extracts greaterThan drop value', () => {
      const result = DropModifier.parse('D{>18}')
      expect(result).toEqual({ drop: { greaterThan: 18 } })
    })

    test('extracts lessThan drop value', () => {
      const result = DropModifier.parse('D{<3}')
      expect(result).toEqual({ drop: { lessThan: 3 } })
    })

    test('handles multiple drop notations', () => {
      const result = DropModifier.parse('L1H1')
      expect(result).toEqual({ drop: { lowest: 1, highest: 1 } })
    })

    test('returns empty object when no drop notation found', () => {
      const result = DropModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    test('drops lowest values', () => {
      const modifier = new DropModifier({ lowest: 1 })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])
    })

    test('drops highest values', () => {
      const modifier = new DropModifier({ highest: 1 })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10])
    })

    test('drops exact values', () => {
      const modifier = new DropModifier({ exact: [10] })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 15])
    })

    test('drops values greater than limit', () => {
      const modifier = new DropModifier({ greaterThan: 10 })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10])
    })

    test('drops values less than limit', () => {
      const modifier = new DropModifier({ lessThan: 10 })
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new DropModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [5, 10, 15],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { CapModifier } from '../../../src/lib'
import { createNumericRollBonus } from '../../support/fixtures'

describe('CapModifier', () => {
  describe('static pattern', () => {
    test('matches cap notation correctly', () => {
      const pattern = CapModifier.pattern

      expect('C{>18}'.match(pattern)).not.toBeNull()
      expect('c{<3}'.match(pattern)).not.toBeNull()
      expect('C{>18,<3}'.match(pattern)).not.toBeNull()
      expect('2d20C{>18}'.match(pattern)).not.toBeNull()

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
      const bonus = createNumericRollBonus({
        rolls: [10, 20]
      })

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'cap',
        options: { greaterThan: 15 },
        added: [15],
        removed: [20]
      })
    })

    test('caps values less than specified limit', () => {
      const modifier = new CapModifier({ lessThan: 15 })
      const bonus = createNumericRollBonus({
        rolls: [10, 20]
      })

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([15, 20])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'cap',
        options: { lessThan: 15 },
        added: [15],
        removed: [10]
      })
    })

    test('caps values with both limits', () => {
      const modifier = new CapModifier({ greaterThan: 18, lessThan: 5 })
      const bonus = createNumericRollBonus({
        rolls: [3, 10, 20]
      })

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10, 18])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'cap',
        options: { greaterThan: 18, lessThan: 5 },
        added: [5, 18],
        removed: [3, 20]
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new CapModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [10, 20]
      })

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for greaterThan cap', () => {
      const modifier = new CapModifier({ greaterThan: 18 })
      const result = modifier.toDescription()

      expect(result).toEqual(['No Rolls greater than [18]'])
    })

    test('returns description for lessThan cap', () => {
      const modifier = new CapModifier({ lessThan: 3 })
      const result = modifier.toDescription()

      expect(result).toEqual(['No Rolls less than [3]'])
    })

    test('returns description for both caps', () => {
      const modifier = new CapModifier({ greaterThan: 18, lessThan: 3 })
      const result = modifier.toDescription()

      expect(result).toEqual([
        'No Rolls greater than [18]',
        'No Rolls less than [3]'
      ])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new CapModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for greaterThan cap', () => {
      const modifier = new CapModifier({ greaterThan: 18 })
      const result = modifier.toNotation()

      expect(result).toBe('C{>18}')
    })

    test('returns notation for lessThan cap', () => {
      const modifier = new CapModifier({ lessThan: 3 })
      const result = modifier.toNotation()

      expect(result).toBe('C{<3}')
    })

    test('returns notation for both caps', () => {
      const modifier = new CapModifier({ greaterThan: 18, lessThan: 3 })
      const result = modifier.toNotation()

      expect(result).toBe('C{>18,<3}')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new CapModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })

  describe('static applySingleCap', () => {
    test('caps values greater than threshold', () => {
      const capFunction = CapModifier.applySingleCap({ greaterThan: 18 })

      expect(capFunction(20)).toBe(18)
      expect(capFunction(18)).toBe(18)
      expect(capFunction(15)).toBe(15)
    })

    test('caps values less than threshold', () => {
      const capFunction = CapModifier.applySingleCap({ lessThan: 3 })

      expect(capFunction(1)).toBe(3)
      expect(capFunction(3)).toBe(3)
      expect(capFunction(5)).toBe(5)
    })

    test('caps values with both thresholds', () => {
      const capFunction = CapModifier.applySingleCap({
        greaterThan: 18,
        lessThan: 3
      })

      expect(capFunction(20)).toBe(18)
      expect(capFunction(1)).toBe(3)
      expect(capFunction(10)).toBe(10)
    })

    test('uses custom value instead of threshold', () => {
      const capFunction = CapModifier.applySingleCap({ greaterThan: 18 }, 15)

      expect(capFunction(20)).toBe(15)
      expect(capFunction(10)).toBe(10)
    })

    test('handles undefined thresholds', () => {
      const capFunction = CapModifier.applySingleCap({})

      expect(capFunction(10)).toBe(10)
      expect(capFunction(20)).toBe(20)
    })
  })
})

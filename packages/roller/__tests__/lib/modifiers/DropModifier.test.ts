import { describe, expect, test } from 'bun:test'
import { DropModifier } from '../../../src/lib/modifiers'
import { createNumericRollBonus } from '../../support/fixtures'

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
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'drop',
        options: { lowest: 1 },
        added: [],
        removed: [5]
      })
    })

    test('drops highest values', () => {
      const modifier = new DropModifier({ highest: 1 })
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'drop',
        options: { highest: 1 },
        added: [],
        removed: [15]
      })
    })

    test('drops exact values', () => {
      const modifier = new DropModifier({ exact: [10] })
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 15])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'drop',
        options: { exact: [10] },
        added: [],
        removed: [10]
      })
    })

    test('drops values greater than limit', () => {
      const modifier = new DropModifier({ greaterThan: 10 })
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 10])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'drop',
        options: { greaterThan: 10 },
        added: [],
        removed: [15]
      })
    })

    test('drops values less than limit', () => {
      const modifier = new DropModifier({ lessThan: 10 })
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([10, 15])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'drop',
        options: { lessThan: 10 },
        added: [],
        removed: [5]
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new DropModifier(undefined)
      const bonus = createNumericRollBonus()

      const result = modifier.apply(bonus)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for single highest drop', () => {
      const modifier = new DropModifier({ highest: 1 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop highest'])
    })

    test('returns description for multiple highest drops', () => {
      const modifier = new DropModifier({ highest: 2 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop highest 2'])
    })

    test('returns description for single lowest drop', () => {
      const modifier = new DropModifier({ lowest: 1 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop lowest'])
    })

    test('returns description for multiple lowest drops', () => {
      const modifier = new DropModifier({ lowest: 3 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop lowest 3'])
    })

    test('returns description for exact value drops', () => {
      const modifier = new DropModifier({ exact: [1, 2, 6] })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop [1] [2] and [6]'])
    })

    test('returns description for greaterThan drops', () => {
      const modifier = new DropModifier({ greaterThan: 18 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop greater than [18]'])
    })

    test('returns description for lessThan drops', () => {
      const modifier = new DropModifier({ lessThan: 3 })
      const result = modifier.toDescription()

      expect(result).toEqual(['Drop less than [3]'])
    })

    test('returns description for combined drop options', () => {
      const modifier = new DropModifier({
        highest: 1,
        exact: [1],
        greaterThan: 18
      })
      const result = modifier.toDescription()

      expect(result).toEqual([
        'Drop highest',
        'Drop [1]',
        'Drop greater than [18]'
      ])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new DropModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for single highest drop', () => {
      const modifier = new DropModifier({ highest: 1 })
      const result = modifier.toNotation()

      expect(result).toBe('H')
    })

    test('returns notation for multiple highest drops', () => {
      const modifier = new DropModifier({ highest: 2 })
      const result = modifier.toNotation()

      expect(result).toBe('H2')
    })

    test('returns notation for single lowest drop', () => {
      const modifier = new DropModifier({ lowest: 1 })
      const result = modifier.toNotation()

      expect(result).toBe('L')
    })

    test('returns notation for multiple lowest drops', () => {
      const modifier = new DropModifier({ lowest: 3 })
      const result = modifier.toNotation()

      expect(result).toBe('L3')
    })

    test('returns notation for exact value drops', () => {
      const modifier = new DropModifier({ exact: [1, 2, 6] })
      const result = modifier.toNotation()

      expect(result).toBe('D{1,2,6}')
    })

    test('returns notation for greaterThan drops', () => {
      const modifier = new DropModifier({ greaterThan: 18 })
      const result = modifier.toNotation()

      expect(result).toBe('D{>18}')
    })

    test('returns notation for lessThan drops', () => {
      const modifier = new DropModifier({ lessThan: 3 })
      const result = modifier.toNotation()

      expect(result).toBe('D{<3}')
    })

    test('returns notation for combined drop options', () => {
      const modifier = new DropModifier({
        highest: 2,
        exact: [1],
        greaterThan: 18
      })
      const result = modifier.toNotation()

      expect(result).toBe('H2D{>18,1}')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new DropModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })

  describe('static parseHigh', () => {
    test('parses single highest drop notation', () => {
      const result = DropModifier.parseHigh(['H'])
      expect(result).toEqual({ drop: { highest: 1 } })
    })

    test('parses multiple highest drop notation', () => {
      const result = DropModifier.parseHigh(['H3'])
      expect(result).toEqual({ drop: { highest: 3 } })
    })

    test('parses lowercase highest drop notation', () => {
      const result = DropModifier.parseHigh(['h2'])
      expect(result).toEqual({ drop: { highest: 2 } })
    })

    test('returns empty object for empty array', () => {
      const result = DropModifier.parseHigh([])
      expect(result).toEqual({})
    })

    test('uses last notation when multiple provided', () => {
      const result = DropModifier.parseHigh(['H1', 'H3'])
      expect(result).toEqual({ drop: { highest: 3 } })
    })
  })

  describe('static parseLow', () => {
    test('parses single lowest drop notation', () => {
      const result = DropModifier.parseLow(['L'])
      expect(result).toEqual({ drop: { lowest: 1 } })
    })

    test('parses multiple lowest drop notation', () => {
      const result = DropModifier.parseLow(['L2'])
      expect(result).toEqual({ drop: { lowest: 2 } })
    })

    test('parses lowercase lowest drop notation', () => {
      const result = DropModifier.parseLow(['l3'])
      expect(result).toEqual({ drop: { lowest: 3 } })
    })

    test('returns empty drop object for empty array', () => {
      const result = DropModifier.parseLow([])
      expect(result).toEqual({ drop: {} })
    })

    test('uses last notation when multiple provided', () => {
      const result = DropModifier.parseLow(['L1', 'L4'])
      expect(result).toEqual({ drop: { lowest: 4 } })
    })
  })

  describe('static parseConstraints', () => {
    test('parses exact value constraints', () => {
      const result = DropModifier.parseConstraints(['D{1,6}'])
      expect(result).toEqual({ drop: { exact: [1, 6] } })
    })

    test('parses greaterThan constraints', () => {
      const result = DropModifier.parseConstraints(['D{>4}'])
      expect(result).toEqual({ drop: { greaterThan: 4 } })
    })

    test('parses lessThan constraints', () => {
      const result = DropModifier.parseConstraints(['D{<3}'])
      expect(result).toEqual({ drop: { lessThan: 3 } })
    })

    test('parses mixed constraints', () => {
      const result = DropModifier.parseConstraints(['D{1,>4,<2}'])
      expect(result).toEqual({
        drop: { exact: [1], greaterThan: 4, lessThan: 2 }
      })
    })

    test('returns empty object for empty array', () => {
      const result = DropModifier.parseConstraints([])
      expect(result).toEqual({})
    })

    test('handles multiple constraint notations', () => {
      const result = DropModifier.parseConstraints(['D{1}', 'D{>5}'])
      expect(result).toEqual({ drop: { exact: [1], greaterThan: 5 } })
    })
  })
})

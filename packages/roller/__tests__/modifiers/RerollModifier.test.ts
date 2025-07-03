import { describe, expect, test } from 'bun:test'
import { RerollModifier } from '../../src/modifiers/RerollModifier'
import {
  createMockRollOne,
  createNumericRollBonus,
  createRequiredNumericRollParameters
} from '../support/fixtures'

describe('RerollModifier', () => {
  describe('static pattern', () => {
    test('matches reroll notation correctly', () => {
      const pattern = RerollModifier.pattern

      expect('R{1}'.match(pattern)).not.toBeNull()
      expect('r{1,2}'.match(pattern)).not.toBeNull()
      expect('R{>18}'.match(pattern)).not.toBeNull()
      expect('R{<3}'.match(pattern)).not.toBeNull()
      expect('2d6R{1}'.match(pattern)).not.toBeNull()

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
    const mockRollOne = createMockRollOne()

    test('rerolls exact values', () => {
      const modifier = new RerollModifier({ exact: [1, 2] })
      const bonus = createNumericRollBonus({
        rolls: [1, 3, 2]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 3
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([4, 3, 4])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { exact: [1, 2] },
        added: [4, 4],
        removed: [1, 2]
      })
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new RerollModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [1, 3, 5]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 3
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result).toBe(bonus)
    })

    test('rerolls values greater than threshold', () => {
      const modifier = new RerollModifier({ greaterThan: 18 })
      const bonus = createNumericRollBonus({
        rolls: [15, 19, 20, 10]
      })
      const params = createRequiredNumericRollParameters({
        sides: 20,
        quantity: 4
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([15, 4, 4, 10])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { greaterThan: 18 },
        added: [4, 4],
        removed: [19, 20]
      })
    })

    test('rerolls values less than threshold', () => {
      const modifier = new RerollModifier({ lessThan: 3 })
      const bonus = createNumericRollBonus({
        rolls: [1, 2, 3, 4]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 4
      })

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([4, 4, 3, 4])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { lessThan: 3 },
        added: [4, 4],
        removed: [1, 2]
      })
    })

    test('enforces maximum reroll limits', () => {
      let rollCount = 0
      const mockRollOneWithLimit = (): number => {
        rollCount++
        return 1
      }

      const modifier = new RerollModifier({ exact: [1], max: 2 })
      const bonus = createNumericRollBonus({
        rolls: [1]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 1
      })

      const result = modifier.apply(bonus, params, mockRollOneWithLimit)

      expect(rollCount).toBe(2)
      expect(result.rolls).toEqual([1])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { exact: [1], max: 2 },
        added: [],
        removed: []
      })
    })

    test('prevents infinite rerolls with 99 reroll safety limit', () => {
      let rollCount = 0
      const mockRollOneInfinite = (): number => {
        rollCount++
        return 1
      }

      const modifier = new RerollModifier({ exact: [1] })
      const bonus = createNumericRollBonus({
        rolls: [1]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 1
      })

      const result = modifier.apply(bonus, params, mockRollOneInfinite)

      expect(rollCount).toBe(99)
      expect(result.rolls).toEqual([1])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { exact: [1] },
        added: [],
        removed: []
      })
    })

    test('handles complex reroll conditions', () => {
      const modifier = new RerollModifier({
        exact: [1, 6],
        lessThan: 3,
        greaterThan: 18
      })
      const bonus = createNumericRollBonus({
        rolls: [1, 2, 6, 10, 19, 20]
      })
      const params = createRequiredNumericRollParameters({
        sides: 20,
        quantity: 6
      })

      const result = modifier.apply(bonus, params, mockRollOne)

      expect(result.rolls).toEqual([4, 4, 4, 10, 4, 4])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { exact: [1, 6], lessThan: 3, greaterThan: 18 },
        added: [4, 4, 4, 4, 4],
        removed: [1, 2, 6, 19, 20]
      })
    })

    test('performance with high reroll counts', () => {
      let rollCount = 0
      const mockRollOnePerformance = (): number => {
        rollCount++
        return rollCount <= 50 ? 1 : 5
      }

      const modifier = new RerollModifier({ exact: [1] })
      const bonus = createNumericRollBonus({
        rolls: [1, 1, 1]
      })
      const params = createRequiredNumericRollParameters({
        quantity: 3
      })

      const startTime = performance.now()
      const result = modifier.apply(bonus, params, mockRollOnePerformance)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
      expect(result.rolls).toEqual([5, 5, 5])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'reroll',
        options: { exact: [1] },
        added: [5, 5, 5],
        removed: [1, 1, 1]
      })
    })

    test('handles undefined options in nested calls', () => {
      const modifier = new RerollModifier(undefined)
      const bonus = createNumericRollBonus({
        rolls: [1, 2, 3]
      })

      const result = modifier.apply(bonus, undefined, mockRollOne)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for exact values', () => {
      const modifier = new RerollModifier({ exact: [1, 2] })
      const result = modifier.toDescription()
      expect(result).toEqual(['Reroll [1] and [2]'])
    })

    test('returns description for greaterThan condition', () => {
      const modifier = new RerollModifier({ greaterThan: 18 })
      const result = modifier.toDescription()
      expect(result).toBeDefined()
      expect(result?.[0]).toContain('Reroll')
      expect(result?.[0]).toContain('greater than [18]')
    })

    test('returns description for lessThan condition', () => {
      const modifier = new RerollModifier({ lessThan: 3 })
      const result = modifier.toDescription()
      expect(result).toBeDefined()
      expect(result?.[0]).toContain('Reroll')
      expect(result?.[0]).toContain('less than [3]')
    })

    test('returns description with max reroll count', () => {
      const modifier = new RerollModifier({ exact: [1], max: 3 })
      const result = modifier.toDescription()
      expect(result).toEqual(['Reroll [1] (up to 3 times)'])
    })

    test('returns description for combined conditions', () => {
      const modifier = new RerollModifier({
        exact: [1, 2],
        greaterThan: 18,
        max: 2
      })
      const result = modifier.toDescription()
      expect(result).toBeDefined()
      expect(result?.[0]).toContain('Reroll')
      expect(result?.[0]).toContain('[1] and [2]')
      expect(result?.[0]).toContain('greater than [18]')
      expect(result?.[0]).toContain('(up to 2 times)')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new RerollModifier(undefined)
      const result = modifier.toDescription()
      expect(result).toBeUndefined()
    })

    test('returns undefined when no valid conditions are set', () => {
      const modifier = new RerollModifier({})
      const result = modifier.toDescription()
      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for exact values', () => {
      const modifier = new RerollModifier({ exact: [1, 2] })
      const result = modifier.toNotation()
      expect(result).toBe('R{1,2}')
    })

    test('returns notation for greaterThan condition', () => {
      const modifier = new RerollModifier({ greaterThan: 18 })
      const result = modifier.toNotation()
      expect(result).toContain('R{')
      expect(result).toContain('>18')
      expect(result).toContain('}')
    })

    test('returns notation for lessThan condition', () => {
      const modifier = new RerollModifier({ lessThan: 3 })
      const result = modifier.toNotation()
      expect(result).toContain('R{')
      expect(result).toContain('<3')
      expect(result).toContain('}')
    })

    test('returns notation with max reroll count', () => {
      const modifier = new RerollModifier({ exact: [1], max: 3 })
      const result = modifier.toNotation()
      expect(result).toBe('R{1}3')
    })

    test('returns notation for combined conditions', () => {
      const modifier = new RerollModifier({
        exact: [1, 2],
        greaterThan: 18
      })
      const result = modifier.toNotation()
      expect(result).toContain('R{')
      expect(result).toContain('1,2')
      expect(result).toContain('>18')
      expect(result).toContain('}')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new RerollModifier(undefined)
      const result = modifier.toNotation()
      expect(result).toBeUndefined()
    })

    test('returns empty string when no valid conditions are set', () => {
      const modifier = new RerollModifier({})
      const result = modifier.toNotation()
      expect(result).toBe('')
    })

    test('handles undefined max in notation', () => {
      const modifier = new RerollModifier({ exact: [1] })
      const result = modifier.toNotation()
      expect(result).toBe('R{1}')
    })
  })
})

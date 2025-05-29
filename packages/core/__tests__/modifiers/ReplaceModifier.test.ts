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

    test('handles replacement with empty arrays', () => {
      const modifier = new ReplaceModifier([])
      const bonus: NumericRollBonus = {
        rolls: [1, 2, 3],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([1, 2, 3])
    })

    test('handles replacement with duplicate values', () => {
      const modifier = new ReplaceModifier([
        { from: 1, to: 5 },
        { from: 1, to: 6 }, // Duplicate from value
        { from: 2, to: 5 }  // Duplicate to value
      ])
      const bonus: NumericRollBonus = {
        rolls: [1, 2, 3],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([5, 5, 3])
    })

    test('handles replacement with out-of-range values', () => {
      const modifier = new ReplaceModifier([
        { from: 100, to: 1 }, // from value not in typical dice range
        { from: 1, to: 100 }  // to value outside typical dice range
      ])
      const bonus: NumericRollBonus = {
        rolls: [1, 6, 100],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([100, 6, 100])
    })

    test('handles complex nested replacement rules', () => {
      const modifier = new ReplaceModifier([
        { from: { greaterThan: 18 }, to: 18 },
        { from: { lessThan: 3 }, to: 3 },
        { from: 10, to: 11 }
      ])
      const bonus: NumericRollBonus = {
        rolls: [1, 10, 20, 15, 2],
        simpleMathModifier: 0
      }

      const result = modifier.apply(bonus)
      expect(result.rolls).toEqual([3, 11, 18, 15, 3])
    })

    test('performance with large datasets', () => {
      const largeRolls = Array.from({ length: 1000 }, (_, i) => (i % 20) + 1)
      const modifier = new ReplaceModifier({ from: 1, to: 21 })
      const bonus: NumericRollBonus = {
        rolls: largeRolls,
        simpleMathModifier: 0
      }

      const startTime = performance.now()
      const result = modifier.apply(bonus)
      const endTime = performance.now()

      // Should complete within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)

      // Verify correctness
      const expectedRolls = largeRolls.map(roll => roll === 1 ? 21 : roll)
      expect(result.rolls).toEqual(expectedRolls)
    })
  })

  describe('toDescription', () => {
    test('returns description for single replace rule', () => {
      const modifier = new ReplaceModifier({ from: 1, to: 2 })
      const result = modifier.toDescription()
      expect(result).toEqual(['Replace [1] with [2]'])
    })

    test('returns description for array of replace rules', () => {
      const modifier = new ReplaceModifier([
        { from: 1, to: 2 },
        { from: { greaterThan: 18 }, to: 18 }
      ])
      const result = modifier.toDescription()
      expect(result).toHaveLength(2)
      expect(result?.[0]).toBe('Replace [1] with [2]')
      expect(result?.[1]).toContain('Replace')
      expect(result?.[1]).toContain('with [18]')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new ReplaceModifier(undefined)
      const result = modifier.toDescription()
      expect(result).toBeUndefined()
    })

    test('handles complex comparison options in description', () => {
      const modifier = new ReplaceModifier({
        from: { lessThan: 5, greaterThan: 15 },
        to: 10
      })
      const result = modifier.toDescription()
      expect(result).toBeDefined()
      expect(result?.[0]).toContain('Replace')
      expect(result?.[0]).toContain('with [10]')
    })
  })

  describe('toNotation', () => {
    test('returns notation for single replace rule', () => {
      const modifier = new ReplaceModifier({ from: 1, to: 2 })
      const result = modifier.toNotation()
      expect(result).toBe('V{1=2}')
    })

    test('returns notation for array of replace rules', () => {
      const modifier = new ReplaceModifier([
        { from: 1, to: 2 },
        { from: 3, to: 4 }
      ])
      const result = modifier.toNotation()
      expect(result).toBe('V{1=2,3=4}')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new ReplaceModifier(undefined)
      const result = modifier.toNotation()
      expect(result).toBeUndefined()
    })

    test('handles comparison options in notation', () => {
      const modifier = new ReplaceModifier({
        from: { greaterThan: 18 },
        to: 18
      })
      const result = modifier.toNotation()
      expect(result).toContain('V{')
      expect(result).toContain('=18}')
    })
  })
})

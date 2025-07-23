import { describe, expect, test } from 'bun:test'
import { ModifierEngine } from '../../../src/lib/modifiers/ModifierEngine'
import type { NumericRollBonus } from '../../../src/types/modifiers'

describe('ModifierEngine', () => {
  const createBasicBonus = (rolls: number[]): NumericRollBonus => ({
    rolls,
    simpleMathModifier: 0,
    logs: []
  })

  const mockRollOne = (): number => Math.floor(Math.random() * 6) + 1
  const mockContext = { sides: 6, quantity: 4 }

  describe('apply method', () => {
    describe('arithmetic modifiers', () => {
      test('applies plus modifier correctly', () => {
        const bonus = createBasicBonus([3, 4, 5])
        const result = ModifierEngine.apply('plus', 5, bonus)

        expect(result.rolls).toEqual([3, 4, 5])
        expect(result.simpleMathModifier).toBe(5)
        expect(result.logs).toEqual([])
      })

      test('applies minus modifier correctly', () => {
        const bonus = createBasicBonus([3, 4, 5])
        const result = ModifierEngine.apply('minus', 3, bonus)

        expect(result.rolls).toEqual([3, 4, 5])
        expect(result.simpleMathModifier).toBe(-3)
        expect(result.logs).toEqual([])
      })

      test('handles undefined arithmetic modifiers', () => {
        const bonus = createBasicBonus([3, 4, 5])
        const result = ModifierEngine.apply('plus', undefined, bonus)

        expect(result).toBe(bonus)
      })
    })

    describe('cap modifier', () => {
      test('caps values greater than limit', () => {
        const bonus = createBasicBonus([1, 6, 3, 6])
        const result = ModifierEngine.apply('cap', { greaterThan: 5 }, bonus)

        expect(result.rolls).toEqual([1, 5, 3, 5])
        expect(result.logs).toHaveLength(1)
        expect(result.logs[0]?.modifier).toBe('cap')
      })

      test('caps values less than limit', () => {
        const bonus = createBasicBonus([1, 6, 3, 1])
        const result = ModifierEngine.apply('cap', { lessThan: 2 }, bonus)

        expect(result.rolls).toEqual([2, 6, 3, 2])
        expect(result.logs).toHaveLength(1)
      })

      test('caps values with both limits', () => {
        const bonus = createBasicBonus([1, 6, 3, 4])
        const result = ModifierEngine.apply(
          'cap',
          { greaterThan: 5, lessThan: 2 },
          bonus
        )

        expect(result.rolls).toEqual([2, 5, 3, 4])
      })
    })

    describe('drop modifier', () => {
      test('drops lowest values', () => {
        const bonus = createBasicBonus([1, 6, 3, 4])
        const result = ModifierEngine.apply('drop', { lowest: 1 }, bonus)

        expect(result.rolls).toEqual([3, 4, 6])
        expect(result.logs).toHaveLength(1)
        expect(result.logs[0]?.modifier).toBe('drop')
      })

      test('drops highest values', () => {
        const bonus = createBasicBonus([1, 6, 3, 4])
        const result = ModifierEngine.apply('drop', { highest: 1 }, bonus)

        expect(result.rolls).toEqual([1, 3, 4])
      })

      test('drops exact values', () => {
        const bonus = createBasicBonus([1, 6, 3, 1])
        const result = ModifierEngine.apply('drop', { exact: [1] }, bonus)

        expect(result.rolls).toEqual([6, 3])
      })

      test('drops values greater than limit', () => {
        const bonus = createBasicBonus([1, 6, 3, 4])
        const result = ModifierEngine.apply('drop', { greaterThan: 4 }, bonus)

        expect(result.rolls).toEqual([1, 3, 4])
      })
    })

    describe('reroll modifier', () => {
      test('rerolls exact values', () => {
        const bonus = createBasicBonus([1, 6, 1, 4])
        const fixedRollOne = (): number => 5
        const result = ModifierEngine.apply(
          'reroll',
          { exact: [1] },
          bonus,
          mockContext,
          fixedRollOne
        )

        expect(result.rolls).toEqual([5, 6, 5, 4])
        expect(result.logs).toHaveLength(1)
        expect(result.logs[0]?.modifier).toBe('reroll')
      })

      test('rerolls values greater than threshold', () => {
        const bonus = createBasicBonus([1, 6, 3, 6])
        const fixedRollOne = (): number => 4
        const result = ModifierEngine.apply(
          'reroll',
          { greaterThan: 5 },
          bonus,
          mockContext,
          fixedRollOne
        )

        expect(result.rolls).toEqual([1, 4, 3, 4])
      })

      test('enforces maximum reroll limits', () => {
        const bonus = createBasicBonus([1, 1, 1, 1])
        let callCount = 0
        const limitedRollOne = (): number => {
          callCount++
          return callCount <= 2 ? 1 : 5 // First 2 calls return 1, then 5
        }
        const result = ModifierEngine.apply(
          'reroll',
          { exact: [1], max: 2 },
          bonus,
          mockContext,
          limitedRollOne
        )

        expect(result.rolls).toEqual([5, 5, 1, 1]) // Only first 2 get rerolled to completion
      })

      test('throws error when rollOne is missing', () => {
        const bonus = createBasicBonus([1, 2, 3])
        expect(() => {
          ModifierEngine.apply('reroll', { exact: [1] }, bonus, mockContext)
        }).toThrow('rollOne function required for reroll modifier')
      })
    })

    describe('explode modifier', () => {
      test('adds additional rolls for maximum values', () => {
        const bonus = createBasicBonus([6, 3, 6, 4])
        const fixedRollOne = (): number => 2
        const result = ModifierEngine.apply(
          'explode',
          true,
          bonus,
          mockContext,
          fixedRollOne
        )

        expect(result.rolls).toEqual([6, 3, 6, 4, 2, 2]) // Two 6s exploded
        expect(result.logs).toHaveLength(1)
        expect(result.logs[0]?.modifier).toBe('explode')
      })

      test('throws error when context or rollOne is missing', () => {
        const bonus = createBasicBonus([6, 3, 4])
        expect(() => {
          ModifierEngine.apply('explode', true, bonus)
        }).toThrow('rollOne and context required for explode modifier')
      })
    })

    describe('unique modifier', () => {
      test('ensures all values are unique', () => {
        const bonus = createBasicBonus([1, 3, 1, 4])
        let rollCount = 0
        const uniqueRollOne = (): number => {
          rollCount++
          return rollCount === 1 ? 2 : 5 // First call returns 2, then 5
        }
        const result = ModifierEngine.apply(
          'unique',
          true,
          bonus,
          mockContext,
          uniqueRollOne
        )

        expect(result.rolls).toEqual([1, 3, 2, 4])
        expect(result.logs).toHaveLength(1)
      })

      test('allows specified values to be duplicated', () => {
        const bonus = createBasicBonus([1, 3, 1, 4])
        const result = ModifierEngine.apply(
          'unique',
          { notUnique: [1] },
          bonus,
          mockContext,
          mockRollOne
        )

        expect(result.rolls).toEqual([1, 3, 1, 4]) // 1s are allowed to duplicate
      })

      test('throws when more rolls than sides', () => {
        const bonus = createBasicBonus([1, 2, 3, 4, 5, 6, 1])
        expect(() => {
          ModifierEngine.apply('unique', true, bonus, mockContext, mockRollOne)
        }).toThrow('Cannot have more rolls than sides when unique is enabled')
      })
    })

    describe('replace modifier', () => {
      test('replaces exact values', () => {
        const bonus = createBasicBonus([1, 6, 1, 4])
        const result = ModifierEngine.apply(
          'replace',
          { from: 1, to: 5 },
          bonus
        )

        expect(result.rolls).toEqual([5, 6, 5, 4])
        expect(result.logs).toHaveLength(1)
        expect(result.logs[0]?.modifier).toBe('replace')
      })

      test('handles array of replace rules', () => {
        const bonus = createBasicBonus([1, 6, 2, 4])
        const result = ModifierEngine.apply(
          'replace',
          [
            { from: 1, to: 5 },
            { from: 2, to: 3 }
          ],
          bonus
        )

        expect(result.rolls).toEqual([5, 6, 3, 4])
      })

      test('replaces values based on comparison', () => {
        const bonus = createBasicBonus([1, 6, 3, 4])
        const result = ModifierEngine.apply(
          'replace',
          { from: { greaterThan: 5 }, to: 5 },
          bonus
        )

        expect(result.rolls).toEqual([1, 5, 3, 4])
      })
    })
  })

  describe('toDescription method', () => {
    test('generates description for plus modifier', () => {
      const result = ModifierEngine.toDescription('plus', 5)
      expect(result).toEqual(['Add 5'])
    })

    test('generates description for minus modifier', () => {
      const result = ModifierEngine.toDescription('minus', 3)
      expect(result).toEqual(['Subtract 3'])
    })

    test('generates description for cap modifier', () => {
      const result = ModifierEngine.toDescription('cap', { greaterThan: 5 })
      expect(result).toEqual(['No Rolls greater than [5]'])
    })

    test('generates description for drop modifier', () => {
      const result = ModifierEngine.toDescription('drop', { lowest: 1 })
      expect(result).toEqual(['Drop lowest'])
    })

    test('generates description for reroll modifier', () => {
      const result = ModifierEngine.toDescription('reroll', { exact: [1, 2] })
      expect(result).toEqual(['Reroll [1] and [2]'])
    })

    test('generates description for explode modifier', () => {
      const result = ModifierEngine.toDescription('explode', true)
      expect(result).toEqual(['Exploding Dice'])
    })

    test('generates description for unique modifier', () => {
      const result = ModifierEngine.toDescription('unique', true)
      expect(result).toEqual(['No Duplicate Rolls'])
    })

    test('generates description for replace modifier', () => {
      const result = ModifierEngine.toDescription('replace', { from: 1, to: 6 })
      expect(result).toEqual(['Replace [1] with [6]'])
    })

    test('returns undefined for undefined options', () => {
      const result = ModifierEngine.toDescription('plus', undefined)
      expect(result).toBeUndefined()
    })
  })

  describe('toNotation method', () => {
    test('generates notation for plus modifier', () => {
      const result = ModifierEngine.toNotation('plus', 5)
      expect(result).toBe('+5')
    })

    test('handles negative plus modifier', () => {
      const result = ModifierEngine.toNotation('plus', -3)
      expect(result).toBe('-3')
    })

    test('generates notation for minus modifier', () => {
      const result = ModifierEngine.toNotation('minus', 3)
      expect(result).toBe('-3')
    })

    test('generates notation for cap modifier', () => {
      const result = ModifierEngine.toNotation('cap', { greaterThan: 5 })
      expect(result).toBe('C{>5}')
    })

    test('generates notation for drop modifier', () => {
      const result = ModifierEngine.toNotation('drop', { lowest: 1 })
      expect(result).toBe('L')
    })

    test('generates notation for reroll modifier', () => {
      const result = ModifierEngine.toNotation('reroll', { exact: [1, 2] })
      expect(result).toBe('R{1,2}')
    })

    test('generates notation for explode modifier', () => {
      const result = ModifierEngine.toNotation('explode', true)
      expect(result).toBe('!')
    })

    test('generates notation for unique modifier', () => {
      const result = ModifierEngine.toNotation('unique', true)
      expect(result).toBe('U')
    })

    test('generates notation for replace modifier', () => {
      const result = ModifierEngine.toNotation('replace', { from: 1, to: 6 })
      expect(result).toBe('V{1=6}')
    })

    test('returns undefined for undefined options', () => {
      const result = ModifierEngine.toNotation('plus', undefined)
      expect(result).toBeUndefined()
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { modifierToDescription, modifierToNotation } from '../../../src/lib/modifiers/format'
import type { NumericRollBonus } from '../../../src/types'
import { applyModifiers } from '../../../src/lib/modifiers/applyModifiers'

const createBasicBonus = (rolls: number[]): NumericRollBonus => ({
  rolls,
  simpleMathModifier: 0,
  logs: []
})

const mockRollOne = (): number => Math.floor(Math.random() * 6) + 1
const mockContext = { sides: 6, quantity: 4 }

describe('applyModifiers', () => {
  describe('arithmetic modifiers', () => {
    test('applies plus modifier correctly', () => {
      const bonus = createBasicBonus([3, 4, 5])
      const result = applyModifiers('plus', 5, bonus)

      expect(result.rolls).toEqual([3, 4, 5])
      expect(result.simpleMathModifier).toBe(5)
      expect(result.logs).toEqual([])
    })

    test('applies minus modifier correctly', () => {
      const bonus = createBasicBonus([3, 4, 5])
      const result = applyModifiers('minus', 3, bonus)

      expect(result.rolls).toEqual([3, 4, 5])
      expect(result.simpleMathModifier).toBe(-3)
      expect(result.logs).toEqual([])
    })

    test('handles undefined arithmetic modifiers', () => {
      const bonus = createBasicBonus([3, 4, 5])
      const result = applyModifiers('plus', undefined, bonus)

      expect(result).toBe(bonus)
    })
  })

  describe('cap modifier', () => {
    test('caps values greater than limit', () => {
      const bonus = createBasicBonus([1, 6, 3, 6])
      const result = applyModifiers('cap', { greaterThan: 5 }, bonus)

      expect(result.rolls).toEqual([1, 5, 3, 5])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('cap')
    })

    test('caps values less than limit', () => {
      const bonus = createBasicBonus([1, 6, 3, 1])
      const result = applyModifiers('cap', { lessThan: 2 }, bonus)

      expect(result.rolls).toEqual([2, 6, 3, 2])
      expect(result.logs).toHaveLength(1)
    })

    test('caps values with both limits', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('cap', { greaterThan: 5, lessThan: 2 }, bonus)

      expect(result.rolls).toEqual([2, 5, 3, 4])
    })
  })

  describe('drop modifier', () => {
    test('drops lowest values', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('drop', { lowest: 1 }, bonus)

      expect(result.rolls).toEqual([3, 4, 6])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('drop')
    })

    test('drops highest values', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('drop', { highest: 1 }, bonus)

      expect(result.rolls).toEqual([1, 3, 4])
    })

    test('drops exact values', () => {
      const bonus = createBasicBonus([1, 6, 3, 1])
      const result = applyModifiers('drop', { exact: [1] }, bonus)

      expect(result.rolls).toEqual([6, 3])
    })

    test('drops values greater than limit', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('drop', { greaterThan: 4 }, bonus)

      expect(result.rolls).toEqual([1, 3, 4])
    })
  })

  describe('keep modifier', () => {
    test('keeps highest values', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('keep', { highest: 2 }, bonus)

      expect(result.rolls).toEqual([4, 6])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('keep')
    })

    test('keeps lowest values', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('keep', { lowest: 2 }, bonus)

      expect(result.rolls).toEqual([1, 3])
    })

    test('keeps highest 1 by default', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('keep', { highest: 1 }, bonus)

      expect(result.rolls).toEqual([6])
    })

    test('keeps lowest 1 by default', () => {
      const bonus = createBasicBonus([1, 6, 3, 4])
      const result = applyModifiers('keep', { lowest: 1 }, bonus)

      expect(result.rolls).toEqual([1])
    })

    test('keep highest 3 from 4 is equivalent to drop lowest 1', () => {
      const bonus1 = createBasicBonus([1, 6, 3, 4])
      const bonus2 = createBasicBonus([1, 6, 3, 4])

      const keepResult = applyModifiers('keep', { highest: 3 }, bonus1)
      const dropResult = applyModifiers('drop', { lowest: 1 }, bonus2)

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })

    test('keep lowest 2 from 4 is equivalent to drop highest 2', () => {
      const bonus1 = createBasicBonus([1, 6, 3, 4])
      const bonus2 = createBasicBonus([1, 6, 3, 4])

      const keepResult = applyModifiers('keep', { lowest: 2 }, bonus1)
      const dropResult = applyModifiers('drop', { highest: 2 }, bonus2)

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })
  })

  describe('reroll modifier', () => {
    test('rerolls exact values', () => {
      const bonus = createBasicBonus([1, 6, 1, 4])
      const fixedRollOne = (): number => 5
      const result = applyModifiers('reroll', { exact: [1] }, bonus, mockContext, fixedRollOne)

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('reroll')
    })

    test('rerolls values greater than threshold', () => {
      const bonus = createBasicBonus([1, 6, 3, 6])
      const fixedRollOne = (): number => 4
      const result = applyModifiers('reroll', { greaterThan: 5 }, bonus, mockContext, fixedRollOne)

      expect(result.rolls).toEqual([1, 4, 3, 4])
    })

    test('enforces maximum reroll limits', () => {
      const bonus = createBasicBonus([1, 1, 1, 1])
      let callCount = 0
      const limitedRollOne = (): number => {
        callCount++
        return callCount <= 2 ? 1 : 5 // First 2 calls return 1, then 5
      }
      const result = applyModifiers(
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
        applyModifiers('reroll', { exact: [1] }, bonus, mockContext)
      }).toThrow('rollOne function required for reroll modifier')
    })
  })

  describe('explode modifier', () => {
    test('adds additional rolls for maximum values', () => {
      const bonus = createBasicBonus([6, 3, 6, 4])
      const fixedRollOne = (): number => 2
      const result = applyModifiers('explode', true, bonus, mockContext, fixedRollOne)

      expect(result.rolls).toEqual([6, 3, 6, 4, 2, 2]) // Two 6s exploded
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('explode')
    })

    test('throws error when context or rollOne is missing', () => {
      const bonus = createBasicBonus([6, 3, 4])
      expect(() => {
        applyModifiers('explode', true, bonus)
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
      const result = applyModifiers('unique', true, bonus, mockContext, uniqueRollOne)

      expect(result.rolls).toEqual([1, 3, 2, 4])
      expect(result.logs).toHaveLength(1)
    })

    test('allows specified values to be duplicated', () => {
      const bonus = createBasicBonus([1, 3, 1, 4])
      const result = applyModifiers('unique', { notUnique: [1] }, bonus, mockContext, mockRollOne)

      expect(result.rolls).toEqual([1, 3, 1, 4]) // 1s are allowed to duplicate
    })

    test('throws when more rolls than sides', () => {
      const bonus = createBasicBonus([1, 2, 3, 4, 5, 6, 1])
      expect(() => {
        applyModifiers('unique', true, bonus, mockContext, mockRollOne)
      }).toThrow('Cannot have more rolls than sides when unique is enabled')
    })
  })

  describe('compound modifier', () => {
    test('adds rerolled value to triggering die', () => {
      const bonus = createBasicBonus([6, 3, 4])
      const fixedRollOne = (): number => 3
      const result = applyModifiers('compound', true, bonus, mockContext, fixedRollOne)

      // The 6 compounds to 6 + 3 = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('compound')
    })

    test('compounds multiple times with depth', () => {
      const bonus = createBasicBonus([6, 4])
      let callCount = 0
      const sequenceRollOne = (): number => {
        callCount++
        return callCount === 1 ? 6 : 2 // First roll is 6 (compounds again), second is 2
      }
      const result = applyModifiers('compound', 5, bonus, mockContext, sequenceRollOne)

      // The 6 compounds: 6 + 6 + 2 = 14
      expect(result.rolls).toEqual([14, 4])
    })

    test('respects max depth limit', () => {
      const bonus = createBasicBonus([6])
      const alwaysMaxRoll = (): number => 6
      const result = applyModifiers('compound', 2, bonus, mockContext, alwaysMaxRoll)

      // Depth 2: 6 + 6 + 6 = 18 (stops after 2 compounds)
      expect(result.rolls).toEqual([18])
    })

    test('does not compound non-max values', () => {
      const bonus = createBasicBonus([5, 3, 4])
      const fixedRollOne = (): number => 6
      const result = applyModifiers('compound', true, bonus, mockContext, fixedRollOne)

      // No dice show max (6), so no compounding
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('throws error when context or rollOne is missing', () => {
      const bonus = createBasicBonus([6, 3, 4])
      expect(() => {
        applyModifiers('compound', true, bonus)
      }).toThrow('rollOne and context required for compound modifier')
    })
  })

  describe('penetrate modifier', () => {
    test('adds rerolled value minus 1 to triggering die', () => {
      const bonus = createBasicBonus([6, 3, 4])
      const fixedRollOne = (): number => 4
      const result = applyModifiers('penetrate', true, bonus, mockContext, fixedRollOne)

      // The 6 penetrates: 6 + (4 - 1) = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('penetrate')
    })

    test('penetrates multiple times with depth', () => {
      const bonus = createBasicBonus([6, 4])
      let callCount = 0
      const sequenceRollOne = (): number => {
        callCount++
        return callCount === 1 ? 6 : 3 // First roll is 6 (penetrates again), second is 3
      }
      const result = applyModifiers('penetrate', 5, bonus, mockContext, sequenceRollOne)

      // The 6 penetrates: 6 + (6 - 1) + (3 - 1) = 6 + 5 + 2 = 13
      expect(result.rolls).toEqual([13, 4])
    })

    test('respects max depth limit', () => {
      const bonus = createBasicBonus([6])
      const alwaysMaxRoll = (): number => 6
      const result = applyModifiers('penetrate', 2, bonus, mockContext, alwaysMaxRoll)

      // Depth 2: 6 + (6-1) + (6-1) = 6 + 5 + 5 = 16
      expect(result.rolls).toEqual([16])
    })

    test('does not penetrate non-max values', () => {
      const bonus = createBasicBonus([5, 3, 4])
      const fixedRollOne = (): number => 6
      const result = applyModifiers('penetrate', true, bonus, mockContext, fixedRollOne)

      // No dice show max (6), so no penetrating
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('minimum penetrated value is 1', () => {
      const bonus = createBasicBonus([6])
      const rollsOne = (): number => 1
      const result = applyModifiers('penetrate', true, bonus, mockContext, rollsOne)

      // The 6 penetrates: 6 + max(1, 1 - 1) = 6 + 1 = 7 (not 6 + 0)
      expect(result.rolls).toEqual([7])
    })

    test('throws error when context or rollOne is missing', () => {
      const bonus = createBasicBonus([6, 3, 4])
      expect(() => {
        applyModifiers('penetrate', true, bonus)
      }).toThrow('rollOne and context required for penetrate modifier')
    })
  })

  describe('replace modifier', () => {
    test('replaces exact values', () => {
      const bonus = createBasicBonus([1, 6, 1, 4])
      const result = applyModifiers('replace', { from: 1, to: 5 }, bonus)

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('replace')
    })

    test('handles array of replace rules', () => {
      const bonus = createBasicBonus([1, 6, 2, 4])
      const result = applyModifiers(
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
      const result = applyModifiers('replace', { from: { greaterThan: 5 }, to: 5 }, bonus)

      expect(result.rolls).toEqual([1, 5, 3, 4])
    })
  })
})

describe('modifiersToDescription', () => {
  test('generates description for plus modifier', () => {
    expect(modifierToDescription('plus', 5)).toEqual(['Add 5'])
  })

  test('generates description for minus modifier', () => {
    expect(modifierToDescription('minus', 3)).toEqual(['Subtract 3'])
  })

  test('generates description for cap modifier', () => {
    const result = modifierToDescription('cap', { greaterThan: 5 })
    expect(result).toEqual(['No Rolls greater than [5]'])
  })

  test('generates description for drop modifier', () => {
    const result = modifierToDescription('drop', { lowest: 1 })
    expect(result).toEqual(['Drop lowest'])
  })

  test('generates description for keep highest modifier', () => {
    const result = modifierToDescription('keep', { highest: 3 })
    expect(result).toEqual(['Keep highest 3'])
  })

  test('generates description for keep highest 1 modifier', () => {
    const result = modifierToDescription('keep', { highest: 1 })
    expect(result).toEqual(['Keep highest'])
  })

  test('generates description for keep lowest modifier', () => {
    const result = modifierToDescription('keep', { lowest: 2 })
    expect(result).toEqual(['Keep lowest 2'])
  })

  test('generates description for keep lowest 1 modifier', () => {
    const result = modifierToDescription('keep', { lowest: 1 })
    expect(result).toEqual(['Keep lowest'])
  })

  test('generates description for reroll modifier', () => {
    const result = modifierToDescription('reroll', { exact: [1, 2] })
    expect(result).toEqual(['Reroll [1] and [2]'])
  })

  test('generates description for explode modifier', () => {
    const result = modifierToDescription('explode', true)
    expect(result).toEqual(['Exploding Dice'])
  })

  test('generates description for unique modifier', () => {
    const result = modifierToDescription('unique', true)
    expect(result).toEqual(['No Duplicate Rolls'])
  })

  test('generates description for replace modifier', () => {
    const result = modifierToDescription('replace', { from: 1, to: 6 })
    expect(result).toEqual(['Replace [1] with [6]'])
  })

  test('returns undefined for undefined options', () => {
    const result = modifierToDescription('plus', undefined)
    expect(result).toBeUndefined()
  })

  test('generates description for compound modifier', () => {
    expect(modifierToDescription('compound', true)).toEqual(['Compounding Dice'])
  })

  test('generates description for compound modifier with depth', () => {
    expect(modifierToDescription('compound', 3)).toEqual(['Compounding Dice (max 3 times)'])
  })

  test('generates description for compound modifier unlimited', () => {
    expect(modifierToDescription('compound', 0)).toEqual(['Compounding Dice (unlimited)'])
  })

  test('generates description for penetrate modifier', () => {
    expect(modifierToDescription('penetrate', true)).toEqual(['Penetrating Dice'])
  })

  test('generates description for penetrate modifier with depth', () => {
    expect(modifierToDescription('penetrate', 3)).toEqual(['Penetrating Dice (max 3 times)'])
  })

  test('generates description for penetrate modifier unlimited', () => {
    expect(modifierToDescription('penetrate', 0)).toEqual(['Penetrating Dice (unlimited)'])
  })
})

describe('modifierToNotation method', () => {
  test('generates notation for plus modifier', () => {
    const result = modifierToNotation('plus', 5)
    expect(result).toBe('+5')
  })

  test('handles negative plus modifier', () => {
    const result = modifierToNotation('plus', -3)
    expect(result).toBe('-3')
  })

  test('generates notation for minus modifier', () => {
    const result = modifierToNotation('minus', 3)
    expect(result).toBe('-3')
  })

  test('generates notation for cap modifier', () => {
    const result = modifierToNotation('cap', { greaterThan: 5 })
    expect(result).toBe('C{>5}')
  })

  test('generates notation for drop modifier', () => {
    const result = modifierToNotation('drop', { lowest: 1 })
    expect(result).toBe('L')
  })

  test('generates notation for keep highest modifier', () => {
    const result = modifierToNotation('keep', { highest: 3 })
    expect(result).toBe('K3')
  })

  test('generates notation for keep highest 1 modifier', () => {
    const result = modifierToNotation('keep', { highest: 1 })
    expect(result).toBe('K')
  })

  test('generates notation for keep lowest modifier', () => {
    const result = modifierToNotation('keep', { lowest: 2 })
    expect(result).toBe('kl2')
  })

  test('generates notation for keep lowest 1 modifier', () => {
    const result = modifierToNotation('keep', { lowest: 1 })
    expect(result).toBe('kl')
  })

  test('generates notation for reroll modifier', () => {
    const result = modifierToNotation('reroll', { exact: [1, 2] })
    expect(result).toBe('R{1,2}')
  })

  test('generates notation for explode modifier', () => {
    const result = modifierToNotation('explode', true)
    expect(result).toBe('!')
  })

  test('generates notation for unique modifier', () => {
    const result = modifierToNotation('unique', true)
    expect(result).toBe('U')
  })

  test('generates notation for replace modifier', () => {
    const result = modifierToNotation('replace', { from: 1, to: 6 })
    expect(result).toBe('V{1=6}')
  })

  test('returns undefined for undefined options', () => {
    const result = modifierToNotation('plus', undefined)
    expect(result).toBeUndefined()
  })

  test('generates notation for compound modifier', () => {
    const result = modifierToNotation('compound', true)
    expect(result).toBe('!!')
  })

  test('generates notation for compound modifier with depth', () => {
    const result = modifierToNotation('compound', 3)
    expect(result).toBe('!!3')
  })

  test('generates notation for compound modifier unlimited', () => {
    const result = modifierToNotation('compound', 0)
    expect(result).toBe('!!0')
  })

  test('generates notation for penetrate modifier', () => {
    const result = modifierToNotation('penetrate', true)
    expect(result).toBe('!p')
  })

  test('generates notation for penetrate modifier with depth', () => {
    const result = modifierToNotation('penetrate', 3)
    expect(result).toBe('!p3')
  })

  test('generates notation for penetrate modifier unlimited', () => {
    const result = modifierToNotation('penetrate', 0)
    expect(result).toBe('!p0')
  })
})

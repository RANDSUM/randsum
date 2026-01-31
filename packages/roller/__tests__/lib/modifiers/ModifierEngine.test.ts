import { describe, expect, test } from 'bun:test'
import {
  type ModifierContext,
  applyAllModifiersFromRegistry,
  applyModifierFromRegistry,
  modifierToDescriptionFromRegistry,
  modifierToNotationFromRegistry,
  parseModifiersFromRegistry,
  validateModifiersFromRegistry
} from '../../../src/lib/modifiers'

const mockRollOne = (): number => Math.floor(Math.random() * 6) + 1
const mockContext: ModifierContext = {
  rollOne: mockRollOne,
  parameters: { sides: 6, quantity: 4 }
}

describe('applyModifierFromRegistry', () => {
  describe('arithmetic modifiers', () => {
    test('applies plus modifier correctly', () => {
      const result = applyModifierFromRegistry('plus', 5, [3, 4, 5], mockContext)

      expect(result.rolls).toEqual([3, 4, 5])
      // Plus now uses transformTotal - verify it transforms correctly
      expect(result.transformTotal).toBeDefined()
      if (result.transformTotal) {
        expect(result.transformTotal(10, [3, 4, 5])).toBe(15) // 10 + 5 = 15
      }
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('plus')
    })

    test('applies minus modifier correctly', () => {
      const result = applyModifierFromRegistry('minus', 3, [3, 4, 5], mockContext)

      expect(result.rolls).toEqual([3, 4, 5])
      // Minus now uses transformTotal - verify it transforms correctly
      expect(result.transformTotal).toBeDefined()
      if (result.transformTotal) {
        expect(result.transformTotal(10, [3, 4, 5])).toBe(7) // 10 - 3 = 7
      }
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('minus')
    })

    test('handles undefined arithmetic modifiers', () => {
      const result = applyModifierFromRegistry('plus', undefined, [3, 4, 5], mockContext)

      expect(result.rolls).toEqual([3, 4, 5])
      expect(result.transformTotal).toBeUndefined()
      expect(result.log).toBeNull()
    })
  })

  describe('cap modifier', () => {
    test('caps values greater than limit', () => {
      const result = applyModifierFromRegistry('cap', { greaterThan: 5 }, [1, 6, 3, 6], mockContext)

      expect(result.rolls).toEqual([1, 5, 3, 5])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('cap')
    })

    test('caps values less than limit', () => {
      const result = applyModifierFromRegistry('cap', { lessThan: 2 }, [1, 6, 3, 1], mockContext)

      expect(result.rolls).toEqual([2, 6, 3, 2])
      expect(result.log).not.toBeNull()
    })

    test('caps values with both limits', () => {
      const result = applyModifierFromRegistry(
        'cap',
        { greaterThan: 5, lessThan: 2 },
        [1, 6, 3, 4],
        mockContext
      )

      expect(result.rolls).toEqual([2, 5, 3, 4])
    })
  })

  describe('drop modifier', () => {
    test('drops lowest values', () => {
      const result = applyModifierFromRegistry('drop', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([3, 4, 6])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('drop')
    })

    test('drops highest values', () => {
      const result = applyModifierFromRegistry('drop', { highest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 3, 4])
    })

    test('drops exact values', () => {
      const result = applyModifierFromRegistry('drop', { exact: [1] }, [1, 6, 3, 1], mockContext)

      expect(result.rolls).toEqual([6, 3])
    })

    test('drops values greater than limit', () => {
      const result = applyModifierFromRegistry(
        'drop',
        { greaterThan: 4 },
        [1, 6, 3, 4],
        mockContext
      )

      expect(result.rolls).toEqual([1, 3, 4])
    })
  })

  describe('keep modifier', () => {
    test('keeps highest values', () => {
      const result = applyModifierFromRegistry('keep', { highest: 2 }, [1, 6, 3, 4], mockContext)

      // Order is preserved from original array after filtering
      expect(result.rolls).toEqual([6, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('keep')
    })

    test('keeps lowest values', () => {
      const result = applyModifierFromRegistry('keep', { lowest: 2 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 3])
    })

    test('keeps highest 1 by default', () => {
      const result = applyModifierFromRegistry('keep', { highest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([6])
    })

    test('keeps lowest 1 by default', () => {
      const result = applyModifierFromRegistry('keep', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1])
    })

    test('keep highest 3 from 4 is equivalent to drop lowest 1', () => {
      const keepResult = applyModifierFromRegistry(
        'keep',
        { highest: 3 },
        [1, 6, 3, 4],
        mockContext
      )
      const dropResult = applyModifierFromRegistry('drop', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })

    test('keep lowest 2 from 4 is equivalent to drop highest 2', () => {
      const keepResult = applyModifierFromRegistry('keep', { lowest: 2 }, [1, 6, 3, 4], mockContext)
      const dropResult = applyModifierFromRegistry(
        'drop',
        { highest: 2 },
        [1, 6, 3, 4],
        mockContext
      )

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })
  })

  describe('reroll modifier', () => {
    test('rerolls exact values', () => {
      const fixedRollOne = (): number => 5
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifierFromRegistry('reroll', { exact: [1] }, [1, 6, 1, 4], ctx)

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('reroll')
    })

    test('rerolls values greater than threshold', () => {
      const fixedRollOne = (): number => 4
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifierFromRegistry('reroll', { greaterThan: 5 }, [1, 6, 3, 6], ctx)

      expect(result.rolls).toEqual([1, 4, 3, 4])
    })

    test('enforces maximum reroll limits', () => {
      let callCount = 0
      const limitedRollOne = (): number => {
        callCount++
        return callCount <= 2 ? 1 : 5 // First 2 calls return 1, then 5
      }
      const ctx: ModifierContext = {
        rollOne: limitedRollOne,
        parameters: { sides: 6, quantity: 4 }
      }
      const result = applyModifierFromRegistry('reroll', { exact: [1], max: 2 }, [1, 1, 1, 1], ctx)

      expect(result.rolls).toEqual([5, 5, 1, 1]) // Only first 2 get rerolled to completion
    })

    test('throws error when rollOne is missing', () => {
      const ctx: ModifierContext = { parameters: { sides: 6, quantity: 4 } }
      expect(() => {
        applyModifierFromRegistry('reroll', { exact: [1] }, [1, 2, 3], ctx)
      }).toThrow('rollOne function required for reroll modifier')
    })
  })

  describe('explode modifier', () => {
    test('adds additional rolls for maximum values', () => {
      const fixedRollOne = (): number => 2
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifierFromRegistry('explode', true, [6, 3, 6, 4], ctx)

      expect(result.rolls).toEqual([6, 3, 6, 4, 2, 2]) // Two 6s exploded
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('explode')
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifierFromRegistry('explode', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for explode modifier')
    })
  })

  describe('unique modifier', () => {
    test('ensures all values are unique', () => {
      let rollCount = 0
      const uniqueRollOne = (): number => {
        rollCount++
        return rollCount === 1 ? 2 : 5 // First call returns 2, then 5
      }
      const ctx: ModifierContext = { rollOne: uniqueRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifierFromRegistry('unique', true, [1, 3, 1, 4], ctx)

      expect(result.rolls).toEqual([1, 3, 2, 4])
      expect(result.log).not.toBeNull()
    })

    test('allows specified values to be duplicated', () => {
      const ctx: ModifierContext = { rollOne: mockRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifierFromRegistry('unique', { notUnique: [1] }, [1, 3, 1, 4], ctx)

      expect(result.rolls).toEqual([1, 3, 1, 4]) // 1s are allowed to duplicate
    })

    test('throws when more rolls than sides', () => {
      const ctx: ModifierContext = { rollOne: mockRollOne, parameters: { sides: 6, quantity: 7 } }
      expect(() => {
        applyModifierFromRegistry('unique', true, [1, 2, 3, 4, 5, 6, 1], ctx)
      }).toThrow('Cannot have more rolls than sides when unique is enabled')
    })
  })

  describe('compound modifier', () => {
    test('adds rerolled value to triggering die', () => {
      const fixedRollOne = (): number => 3
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifierFromRegistry('compound', true, [6, 3, 4], ctx)

      // The 6 compounds to 6 + 3 = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('compound')
    })

    test('compounds multiple times with depth', () => {
      let callCount = 0
      const sequenceRollOne = (): number => {
        callCount++
        return callCount === 1 ? 6 : 2 // First roll is 6 (compounds again), second is 2
      }
      const ctx: ModifierContext = {
        rollOne: sequenceRollOne,
        parameters: { sides: 6, quantity: 2 }
      }
      const result = applyModifierFromRegistry('compound', 5, [6, 4], ctx)

      // The 6 compounds: 6 + 6 + 2 = 14
      expect(result.rolls).toEqual([14, 4])
    })

    test('respects max depth limit', () => {
      const alwaysMaxRoll = (): number => 6
      const ctx: ModifierContext = { rollOne: alwaysMaxRoll, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifierFromRegistry('compound', 2, [6], ctx)

      // Depth 2: 6 + 6 + 6 = 18 (stops after 2 compounds)
      expect(result.rolls).toEqual([18])
    })

    test('does not compound non-max values', () => {
      const fixedRollOne = (): number => 6
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifierFromRegistry('compound', true, [5, 3, 4], ctx)

      // No dice show max (6), so no compounding
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifierFromRegistry('compound', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for compound modifier')
    })
  })

  describe('penetrate modifier', () => {
    test('adds rerolled value minus 1 to triggering die', () => {
      const fixedRollOne = (): number => 4
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifierFromRegistry('penetrate', true, [6, 3, 4], ctx)

      // The 6 penetrates: 6 + (4 - 1) = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('penetrate')
    })

    test('penetrates multiple times with depth', () => {
      let callCount = 0
      const sequenceRollOne = (): number => {
        callCount++
        return callCount === 1 ? 6 : 3 // First roll is 6 (penetrates again), second is 3
      }
      const ctx: ModifierContext = {
        rollOne: sequenceRollOne,
        parameters: { sides: 6, quantity: 2 }
      }
      const result = applyModifierFromRegistry('penetrate', 5, [6, 4], ctx)

      // The 6 penetrates: 6 + (6 - 1) + (3 - 1) = 6 + 5 + 2 = 13
      expect(result.rolls).toEqual([13, 4])
    })

    test('respects max depth limit', () => {
      const alwaysMaxRoll = (): number => 6
      const ctx: ModifierContext = { rollOne: alwaysMaxRoll, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifierFromRegistry('penetrate', 2, [6], ctx)

      // Depth 2: 6 + (6-1) + (6-1) = 6 + 5 + 5 = 16
      expect(result.rolls).toEqual([16])
    })

    test('does not penetrate non-max values', () => {
      const fixedRollOne = (): number => 6
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifierFromRegistry('penetrate', true, [5, 3, 4], ctx)

      // No dice show max (6), so no penetrating
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('minimum penetrated value is 1', () => {
      const rollsOne = (): number => 1
      const ctx: ModifierContext = { rollOne: rollsOne, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifierFromRegistry('penetrate', true, [6], ctx)

      // The 6 penetrates: 6 + max(1, 1 - 1) = 6 + 1 = 7 (not 6 + 0)
      expect(result.rolls).toEqual([7])
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifierFromRegistry('penetrate', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for penetrate modifier')
    })
  })

  describe('replace modifier', () => {
    test('replaces exact values', () => {
      const result = applyModifierFromRegistry(
        'replace',
        { from: 1, to: 5 },
        [1, 6, 1, 4],
        mockContext
      )

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('replace')
    })

    test('handles array of replace rules', () => {
      const result = applyModifierFromRegistry(
        'replace',
        [
          { from: 1, to: 5 },
          { from: 2, to: 3 }
        ],
        [1, 6, 2, 4],
        mockContext
      )

      expect(result.rolls).toEqual([5, 6, 3, 4])
    })

    test('replaces values based on comparison', () => {
      const result = applyModifierFromRegistry(
        'replace',
        { from: { greaterThan: 5 }, to: 5 },
        [1, 6, 3, 4],
        mockContext
      )

      expect(result.rolls).toEqual([1, 5, 3, 4])
    })
  })
})

describe('modifierToDescriptionFromRegistry', () => {
  test('generates description for plus modifier', () => {
    expect(modifierToDescriptionFromRegistry('plus', 5)).toEqual(['Add 5'])
  })

  test('generates description for minus modifier', () => {
    expect(modifierToDescriptionFromRegistry('minus', 3)).toEqual(['Subtract 3'])
  })

  test('generates description for cap modifier', () => {
    const result = modifierToDescriptionFromRegistry('cap', { greaterThan: 5 })
    expect(result).toEqual(['No Rolls greater than [5]'])
  })

  test('generates description for drop modifier', () => {
    const result = modifierToDescriptionFromRegistry('drop', { lowest: 1 })
    expect(result).toEqual(['Drop lowest'])
  })

  test('generates description for keep highest modifier', () => {
    const result = modifierToDescriptionFromRegistry('keep', { highest: 3 })
    expect(result).toEqual(['Keep highest 3'])
  })

  test('generates description for keep highest 1 modifier', () => {
    const result = modifierToDescriptionFromRegistry('keep', { highest: 1 })
    expect(result).toEqual(['Keep highest'])
  })

  test('generates description for keep lowest modifier', () => {
    const result = modifierToDescriptionFromRegistry('keep', { lowest: 2 })
    expect(result).toEqual(['Keep lowest 2'])
  })

  test('generates description for keep lowest 1 modifier', () => {
    const result = modifierToDescriptionFromRegistry('keep', { lowest: 1 })
    expect(result).toEqual(['Keep lowest'])
  })

  test('generates description for reroll modifier', () => {
    const result = modifierToDescriptionFromRegistry('reroll', { exact: [1, 2] })
    expect(result).toEqual(['Reroll [1] and [2]'])
  })

  test('generates description for explode modifier', () => {
    const result = modifierToDescriptionFromRegistry('explode', true)
    expect(result).toEqual(['Exploding Dice'])
  })

  test('generates description for unique modifier', () => {
    const result = modifierToDescriptionFromRegistry('unique', true)
    expect(result).toEqual(['No Duplicate Rolls'])
  })

  test('generates description for unique modifier with exceptions', () => {
    const result = modifierToDescriptionFromRegistry('unique', { notUnique: [1, 2] })
    expect(result).toEqual(['No Duplicates (except [1] and [2])'])
  })

  test('generates description for replace modifier', () => {
    const result = modifierToDescriptionFromRegistry('replace', { from: 1, to: 6 })
    expect(result).toEqual(['Replace [1] with [6]'])
  })

  test('returns undefined for undefined options', () => {
    const result = modifierToDescriptionFromRegistry('plus', undefined)
    expect(result).toBeUndefined()
  })

  test('generates description for compound modifier', () => {
    expect(modifierToDescriptionFromRegistry('compound', true)).toEqual(['Compounding Dice'])
  })

  test('generates description for compound modifier with depth', () => {
    expect(modifierToDescriptionFromRegistry('compound', 3)).toEqual([
      'Compounding Dice (max 3 times)'
    ])
  })

  test('generates description for compound modifier unlimited', () => {
    expect(modifierToDescriptionFromRegistry('compound', 0)).toEqual([
      'Compounding Dice (unlimited)'
    ])
  })

  test('generates description for penetrate modifier', () => {
    expect(modifierToDescriptionFromRegistry('penetrate', true)).toEqual(['Penetrating Dice'])
  })

  test('generates description for penetrate modifier with depth', () => {
    expect(modifierToDescriptionFromRegistry('penetrate', 3)).toEqual([
      'Penetrating Dice (max 3 times)'
    ])
  })

  test('generates description for penetrate modifier unlimited', () => {
    expect(modifierToDescriptionFromRegistry('penetrate', 0)).toEqual([
      'Penetrating Dice (unlimited)'
    ])
  })
})

describe('modifierToNotationFromRegistry', () => {
  test('generates notation for plus modifier', () => {
    const result = modifierToNotationFromRegistry('plus', 5)
    expect(result).toBe('+5')
  })

  test('handles negative plus modifier', () => {
    const result = modifierToNotationFromRegistry('plus', -3)
    expect(result).toBe('-3')
  })

  test('generates notation for minus modifier', () => {
    const result = modifierToNotationFromRegistry('minus', 3)
    expect(result).toBe('-3')
  })

  test('generates notation for cap modifier', () => {
    const result = modifierToNotationFromRegistry('cap', { greaterThan: 5 })
    expect(result).toBe('C{>5}')
  })

  test('generates notation for drop modifier', () => {
    const result = modifierToNotationFromRegistry('drop', { lowest: 1 })
    expect(result).toBe('L')
  })

  test('generates notation for keep highest modifier', () => {
    const result = modifierToNotationFromRegistry('keep', { highest: 3 })
    expect(result).toBe('K3')
  })

  test('generates notation for keep highest 1 modifier', () => {
    const result = modifierToNotationFromRegistry('keep', { highest: 1 })
    expect(result).toBe('K')
  })

  test('generates notation for keep lowest modifier', () => {
    const result = modifierToNotationFromRegistry('keep', { lowest: 2 })
    expect(result).toBe('kl2')
  })

  test('generates notation for keep lowest 1 modifier', () => {
    const result = modifierToNotationFromRegistry('keep', { lowest: 1 })
    expect(result).toBe('kl')
  })

  test('generates notation for reroll modifier', () => {
    const result = modifierToNotationFromRegistry('reroll', { exact: [1, 2] })
    expect(result).toBe('R{1,2}')
  })

  test('generates notation for explode modifier', () => {
    const result = modifierToNotationFromRegistry('explode', true)
    expect(result).toBe('!')
  })

  test('generates notation for unique modifier', () => {
    const result = modifierToNotationFromRegistry('unique', true)
    expect(result).toBe('U')
  })

  test('generates notation for replace modifier', () => {
    const result = modifierToNotationFromRegistry('replace', { from: 1, to: 6 })
    expect(result).toBe('V{1=6}')
  })

  test('returns undefined for undefined options', () => {
    const result = modifierToNotationFromRegistry('plus', undefined)
    expect(result).toBeUndefined()
  })

  test('generates notation for compound modifier', () => {
    const result = modifierToNotationFromRegistry('compound', true)
    expect(result).toBe('!!')
  })

  test('generates notation for compound modifier with depth', () => {
    const result = modifierToNotationFromRegistry('compound', 3)
    expect(result).toBe('!!3')
  })

  test('generates notation for compound modifier unlimited', () => {
    const result = modifierToNotationFromRegistry('compound', 0)
    expect(result).toBe('!!0')
  })

  test('generates notation for penetrate modifier', () => {
    const result = modifierToNotationFromRegistry('penetrate', true)
    expect(result).toBe('!p')
  })

  test('generates notation for penetrate modifier with depth', () => {
    const result = modifierToNotationFromRegistry('penetrate', 3)
    expect(result).toBe('!p3')
  })

  test('generates notation for penetrate modifier unlimited', () => {
    const result = modifierToNotationFromRegistry('penetrate', 0)
    expect(result).toBe('!p0')
  })

  test('generates notation for multiply modifier', () => {
    const result = modifierToNotationFromRegistry('multiply', 2)
    expect(result).toBe('*2')
  })

  test('generates notation for multiplyTotal modifier', () => {
    const result = modifierToNotationFromRegistry('multiplyTotal', 3)
    expect(result).toBe('**3')
  })

  test('generates notation for countSuccesses modifier', () => {
    const result = modifierToNotationFromRegistry('countSuccesses', { threshold: 7 })
    expect(result).toBe('S{7}')
  })

  test('generates notation for countSuccesses modifier with botch', () => {
    const result = modifierToNotationFromRegistry('countSuccesses', {
      threshold: 7,
      botchThreshold: 1
    })
    expect(result).toBe('S{7,1}')
  })
})

describe('applyModifierFromRegistry - multiply modifiers', () => {
  test('applies multiply modifier correctly', () => {
    const result = applyModifierFromRegistry('multiply', 2, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(12, [3, 4, 5])).toBe(24) // 12 * 2 = 24
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('multiply')
  })

  test('applies multiplyTotal modifier correctly', () => {
    const result = applyModifierFromRegistry('multiplyTotal', 3, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(15, [3, 4, 5])).toBe(45) // 15 * 3 = 45
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('multiplyTotal')
  })

  test('handles undefined multiply modifier', () => {
    const result = applyModifierFromRegistry('multiply', undefined, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeUndefined()
    expect(result.log).toBeNull()
  })
})

describe('applyModifierFromRegistry - countSuccesses modifier', () => {
  const ctx: ModifierContext = { parameters: { sides: 10, quantity: 5 } }

  test('counts successes above threshold', () => {
    const result = applyModifierFromRegistry(
      'countSuccesses',
      { threshold: 7 },
      [5, 7, 8, 3, 10],
      ctx
    )

    expect(result.rolls).toEqual([5, 7, 8, 3, 10])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      // 3 successes: 7, 8, 10 are >= 7
      expect(result.transformTotal(33, [5, 7, 8, 3, 10])).toBe(3)
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('countSuccesses')
  })

  test('counts successes with botch threshold', () => {
    const result = applyModifierFromRegistry(
      'countSuccesses',
      { threshold: 7, botchThreshold: 1 },
      [1, 7, 8, 1, 10],
      ctx
    )

    expect(result.rolls).toEqual([1, 7, 8, 1, 10])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      // 3 successes (7, 8, 10) - 2 botches (1, 1) = 1
      expect(result.transformTotal(27, [1, 7, 8, 1, 10])).toBe(1)
    }
  })

  test('botches can make total negative', () => {
    const result = applyModifierFromRegistry(
      'countSuccesses',
      { threshold: 10, botchThreshold: 3 },
      [1, 2, 3, 4, 5],
      ctx
    )

    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      // 0 successes - 3 botches (1, 2, 3) = -3
      expect(result.transformTotal(15, [1, 2, 3, 4, 5])).toBe(-3)
    }
  })

  test('returns 0 when no successes and no botches', () => {
    const result = applyModifierFromRegistry(
      'countSuccesses',
      { threshold: 10 },
      [1, 2, 3, 4, 5],
      ctx
    )

    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(15, [1, 2, 3, 4, 5])).toBe(0)
    }
  })
})

describe('modifierToDescriptionFromRegistry - additional modifiers', () => {
  test('generates description for multiply modifier', () => {
    const result = modifierToDescriptionFromRegistry('multiply', 2)
    expect(result).toEqual(['Multiply dice by 2'])
  })

  test('generates description for multiplyTotal modifier', () => {
    const result = modifierToDescriptionFromRegistry('multiplyTotal', 3)
    expect(result).toEqual(['Multiply total by 3'])
  })

  test('generates description for countSuccesses modifier', () => {
    const result = modifierToDescriptionFromRegistry('countSuccesses', { threshold: 7 })
    expect(result).toEqual(['Count successes >= [7]'])
  })

  test('generates description for countSuccesses modifier with botch', () => {
    const result = modifierToDescriptionFromRegistry('countSuccesses', {
      threshold: 7,
      botchThreshold: 1
    })
    expect(result).toEqual(['Count successes >= [7], botches <= [1]'])
  })
})

describe('parseModifiersFromRegistry', () => {
  test('parses plus modifier from notation', () => {
    const result = parseModifiersFromRegistry('2d6+5')
    expect(result.plus).toBe(5)
  })

  test('parses minus modifier from notation', () => {
    const result = parseModifiersFromRegistry('2d6-3')
    expect(result.minus).toBe(3)
  })

  test('parses drop lowest from notation', () => {
    const result = parseModifiersFromRegistry('4d6L')
    expect(result.drop).toEqual({ lowest: 1 })
  })

  test('parses drop highest from notation', () => {
    const result = parseModifiersFromRegistry('2d20H')
    expect(result.drop).toEqual({ highest: 1 })
  })

  test('parses keep highest from notation', () => {
    const result = parseModifiersFromRegistry('2d20K')
    expect(result.keep).toEqual({ highest: 1 })
  })

  test('parses explode from notation', () => {
    const result = parseModifiersFromRegistry('3d6!')
    expect(result.explode).toBe(true)
  })

  test('parses unique from notation', () => {
    const result = parseModifiersFromRegistry('4d6U')
    expect(result.unique).toBe(true)
  })

  test('parses reroll from notation', () => {
    const result = parseModifiersFromRegistry('4d6R{1}')
    expect(result.reroll).toEqual({ exact: [1] })
  })

  test('parses cap from notation', () => {
    const result = parseModifiersFromRegistry('3d6C{>5}')
    expect(result.cap).toEqual({ greaterThan: 5 })
  })

  test('parses replace from notation', () => {
    const result = parseModifiersFromRegistry('4d6V{1=6}')
    // Replace modifier returns an array of rules
    expect(result.replace).toEqual([{ from: 1, to: 6 }])
  })

  test('parses compound from notation', () => {
    const result = parseModifiersFromRegistry('3d6!!')
    expect(result.compound).toBe(true)
  })

  test('parses penetrate from notation', () => {
    const result = parseModifiersFromRegistry('3d6!p')
    expect(result.penetrate).toBe(true)
  })

  test('parses multiply from notation', () => {
    const result = parseModifiersFromRegistry('2d6*2')
    expect(result.multiply).toBe(2)
  })

  test('parses multiplyTotal from notation', () => {
    const result = parseModifiersFromRegistry('2d6**3')
    expect(result.multiplyTotal).toBe(3)
  })

  test('parses countSuccesses from notation', () => {
    const result = parseModifiersFromRegistry('5d10S{7}')
    expect(result.countSuccesses).toEqual({ threshold: 7 })
  })

  test('parses countSuccesses with botch from notation', () => {
    const result = parseModifiersFromRegistry('5d10S{7,1}')
    expect(result.countSuccesses).toEqual({ threshold: 7, botchThreshold: 1 })
  })

  test('parses multiple modifiers from notation', () => {
    const result = parseModifiersFromRegistry('4d6L+5')
    expect(result.drop).toEqual({ lowest: 1 })
    expect(result.plus).toBe(5)
  })

  test('returns empty object for notation without modifiers', () => {
    const result = parseModifiersFromRegistry('2d6')
    expect(Object.keys(result).length).toBe(0)
  })
})

describe('applyAllModifiersFromRegistry', () => {
  test('applies multiple modifiers in priority order', () => {
    const fixedRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }

    const result = applyAllModifiersFromRegistry(
      { drop: { lowest: 1 }, plus: 3 },
      [1, 3, 4, 5],
      ctx
    )

    // Drop lowest (1) first, then plus 3 via transformTotal
    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.logs.length).toBe(2)
    expect(result.totalTransformers.length).toBe(1)
    // Apply transformer: (3+4+5) + 3 = 15
    const transformer = result.totalTransformers[0]
    expect(transformer?.(12, [3, 4, 5])).toBe(15)
  })

  test('applies modifiers in priority order (drop before reroll)', () => {
    const fixedRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }

    const result = applyAllModifiersFromRegistry(
      { reroll: { exact: [1] }, drop: { lowest: 1 } },
      [1, 3, 4, 6],
      ctx
    )

    // Drop (priority 20) runs before reroll (priority 40)
    // Drop lowest (1) first, then reroll has nothing matching [1] in remaining rolls
    expect(result.rolls.sort((a, b) => a - b)).toEqual([3, 4, 6])
    expect(result.logs.length).toBe(2)
  })

  test('collects totalTransformers from multiple modifiers', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 2 } }

    const result = applyAllModifiersFromRegistry({ plus: 2, multiply: 3 }, [3, 4], ctx)

    // Both plus and multiply use transformTotal
    expect(result.totalTransformers.length).toBe(2)
    expect(result.rolls).toEqual([3, 4])
  })

  test('handles empty modifiers object', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 3 } }

    const result = applyAllModifiersFromRegistry({}, [1, 2, 3], ctx)

    expect(result.rolls).toEqual([1, 2, 3])
    expect(result.logs.length).toBe(0)
    expect(result.totalTransformers.length).toBe(0)
  })
})

describe('validateModifiersFromRegistry', () => {
  test('validates drop modifier - throws when dropping all dice', () => {
    expect(() => {
      validateModifiersFromRegistry({ drop: { lowest: 4 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot drop 4 dice from a pool of 4')
  })

  test('validates drop modifier - throws when dropping more than available', () => {
    expect(() => {
      validateModifiersFromRegistry({ drop: { highest: 3, lowest: 2 } }, { sides: 6, quantity: 4 })
    }).toThrow('Cannot drop 5 dice from a pool of 4')
  })

  test('validates drop modifier - passes for valid drop count', () => {
    expect(() => {
      validateModifiersFromRegistry({ drop: { lowest: 1 } }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('validates unique modifier - throws when quantity exceeds sides', () => {
    expect(() => {
      validateModifiersFromRegistry({ unique: true }, { sides: 4, quantity: 5 })
    }).toThrow('Cannot have 5 unique values with only 4 sides')
  })

  test('validates unique modifier - passes when quantity equals sides', () => {
    expect(() => {
      validateModifiersFromRegistry({ unique: true }, { sides: 6, quantity: 6 })
    }).not.toThrow()
  })

  test('validates unique modifier - passes when quantity less than sides', () => {
    expect(() => {
      validateModifiersFromRegistry({ unique: true }, { sides: 6, quantity: 4 })
    }).not.toThrow()
  })

  test('validates multiple modifiers together', () => {
    expect(() => {
      validateModifiersFromRegistry(
        { drop: { lowest: 1 }, unique: true },
        { sides: 6, quantity: 4 }
      )
    }).not.toThrow()
  })

  test('handles modifiers without validate function', () => {
    expect(() => {
      validateModifiersFromRegistry({ plus: 5, minus: 3 }, { sides: 6, quantity: 2 })
    }).not.toThrow()
  })
})

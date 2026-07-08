import { describe, expect, test } from 'bun:test'
import type { ModifierContext } from '../../../src/modifiers/schema'
import { applyAllModifiers, applyModifier } from '../../../src/modifiers/registry'
import { explodeModifier } from '../../../src/modifiers/explode'
import { keepModifier } from '../../../src/modifiers/keep'

const mockRollOne = (): number => Math.floor(Math.random() * 6) + 1
const mockContext: ModifierContext = {
  rollOne: mockRollOne,
  parameters: { sides: 6, quantity: 4 }
}

describe('applyModifier', () => {
  describe('arithmetic modifiers', () => {
    test('applies plus modifier correctly', () => {
      const result = applyModifier('plus', 5, [3, 4, 5], mockContext)

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
      const result = applyModifier('minus', 3, [3, 4, 5], mockContext)

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
      const result = applyModifier('plus', undefined, [3, 4, 5], mockContext)

      expect(result.rolls).toEqual([3, 4, 5])
      expect(result.transformTotal).toBeUndefined()
      expect(result.log).toBeNull()
    })
  })

  describe('cap modifier', () => {
    test('caps values greater than limit', () => {
      const result = applyModifier('cap', { greaterThan: 5 }, [1, 6, 3, 6], mockContext)

      expect(result.rolls).toEqual([1, 5, 3, 5])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('cap')
    })

    test('caps values less than limit', () => {
      const result = applyModifier('cap', { lessThan: 2 }, [1, 6, 3, 1], mockContext)

      expect(result.rolls).toEqual([2, 6, 3, 2])
      expect(result.log).not.toBeNull()
    })

    test('caps values with both limits', () => {
      const result = applyModifier(
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
      const result = applyModifier('drop', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([3, 4, 6])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('drop')
    })

    test('drops highest values', () => {
      const result = applyModifier('drop', { highest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 3, 4])
    })

    test('drops exact values', () => {
      const result = applyModifier('drop', { exact: [1] }, [1, 6, 3, 1], mockContext)

      expect(result.rolls).toEqual([6, 3])
    })

    test('drops values greater than limit', () => {
      const result = applyModifier('drop', { greaterThan: 4 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 3, 4])
    })
  })

  describe('keep modifier', () => {
    test('keeps highest values', () => {
      const result = applyModifier('keep', { highest: 2 }, [1, 6, 3, 4], mockContext)

      // Order is preserved from original array after filtering
      expect(result.rolls).toEqual([6, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('keep')
    })

    test('keeps lowest values', () => {
      const result = applyModifier('keep', { lowest: 2 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 3])
    })

    test('keeps highest 1 by default', () => {
      const result = applyModifier('keep', { highest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([6])
    })

    test('keeps lowest 1 by default', () => {
      const result = applyModifier('keep', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(result.rolls).toEqual([1])
    })

    test('keep highest 3 from 4 is equivalent to drop lowest 1', () => {
      const keepResult = applyModifier('keep', { highest: 3 }, [1, 6, 3, 4], mockContext)
      const dropResult = applyModifier('drop', { lowest: 1 }, [1, 6, 3, 4], mockContext)

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })

    test('keep lowest 2 from 4 is equivalent to drop highest 2', () => {
      const keepResult = applyModifier('keep', { lowest: 2 }, [1, 6, 3, 4], mockContext)
      const dropResult = applyModifier('drop', { highest: 2 }, [1, 6, 3, 4], mockContext)

      expect(keepResult.rolls.sort()).toEqual(dropResult.rolls.sort())
    })

    test('returns unchanged rolls when keeping more than available (highest)', () => {
      const result = applyModifier('keep', { highest: 10 }, [1, 2, 3], mockContext)

      expect(result.rolls).toEqual([1, 2, 3])
    })

    test('returns unchanged rolls when keeping more than available (lowest)', () => {
      const result = applyModifier('keep', { lowest: 10 }, [1, 2, 3], mockContext)

      expect(result.rolls).toEqual([1, 2, 3])
    })

    test('returns unchanged rolls when neither highest nor lowest specified', () => {
      const result = applyModifier('keep', {}, [1, 2, 3, 4], mockContext)

      expect(result.rolls).toEqual([1, 2, 3, 4])
    })
  })

  describe('reroll modifier', () => {
    test('rerolls exact values', () => {
      const fixedRollOne = (): number => 5
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifier('reroll', { exact: [1] }, [1, 6, 1, 4], ctx)

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('reroll')
    })

    test('rerolls values greater than threshold', () => {
      const fixedRollOne = (): number => 4
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifier('reroll', { greaterThan: 5 }, [1, 6, 3, 6], ctx)

      expect(result.rolls).toEqual([1, 4, 3, 4])
    })

    test('enforces maximum reroll limits', () => {
      const counter = { value: 0 }
      const limitedRollOne = (): number => {
        counter.value++
        return counter.value <= 2 ? 1 : 5 // First 2 calls return 1, then 5
      }
      const ctx: ModifierContext = {
        rollOne: limitedRollOne,
        parameters: { sides: 6, quantity: 4 }
      }
      const result = applyModifier('reroll', { exact: [1], max: 2 }, [1, 1, 1, 1], ctx)

      expect(result.rolls).toEqual([5, 5, 1, 1]) // Only first 2 get rerolled to completion
    })

    test('throws error when rollOne is missing', () => {
      const ctx: ModifierContext = { parameters: { sides: 6, quantity: 4 } }
      expect(() => {
        applyModifier('reroll', { exact: [1] }, [1, 2, 3], ctx)
      }).toThrow('rollOne function required for reroll modifier')
    })
  })

  describe('explode modifier', () => {
    test('adds additional rolls for maximum values', () => {
      const fixedRollOne = (): number => 2
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifier('explode', true, [6, 3, 6, 4], ctx)

      expect(result.rolls).toEqual([6, 3, 6, 4, 2, 2]) // Two 6s exploded
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('explode')
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifier('explode', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for explode modifier')
    })
  })

  describe('unique modifier', () => {
    test('ensures all values are unique', () => {
      const counter = { value: 0 }
      const uniqueRollOne = (): number => {
        counter.value++
        return counter.value === 1 ? 2 : 5 // First call returns 2, then 5
      }
      const ctx: ModifierContext = { rollOne: uniqueRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifier('unique', true, [1, 3, 1, 4], ctx)

      expect(result.rolls).toEqual([1, 3, 2, 4])
      expect(result.log).not.toBeNull()
    })

    test('allows specified values to be duplicated', () => {
      const ctx: ModifierContext = { rollOne: mockRollOne, parameters: { sides: 6, quantity: 4 } }
      const result = applyModifier('unique', { notUnique: [1] }, [1, 3, 1, 4], ctx)

      expect(result.rolls).toEqual([1, 3, 1, 4]) // 1s are allowed to duplicate
    })

    test('throws when more rolls than sides', () => {
      const ctx: ModifierContext = { rollOne: mockRollOne, parameters: { sides: 6, quantity: 7 } }
      expect(() => {
        applyModifier('unique', true, [1, 2, 3, 4, 5, 6, 1], ctx)
      }).toThrow('Cannot have more rolls than sides when unique is enabled')
    })
  })

  describe('compound modifier', () => {
    test('adds rerolled value to triggering die', () => {
      const fixedRollOne = (): number => 3
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifier('compound', true, [6, 3, 4], ctx)

      // The 6 compounds to 6 + 3 = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('compound')
    })

    test('compounds multiple times with depth', () => {
      const counter = { value: 0 }
      const sequenceRollOne = (): number => {
        counter.value++
        return counter.value === 1 ? 6 : 2 // First roll is 6 (compounds again), second is 2
      }
      const ctx: ModifierContext = {
        rollOne: sequenceRollOne,
        parameters: { sides: 6, quantity: 2 }
      }
      const result = applyModifier('compound', 5, [6, 4], ctx)

      // The 6 compounds: 6 + 6 + 2 = 14
      expect(result.rolls).toEqual([14, 4])
    })

    test('respects max depth limit', () => {
      const alwaysMaxRoll = (): number => 6
      const ctx: ModifierContext = { rollOne: alwaysMaxRoll, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifier('compound', 2, [6], ctx)

      // Depth 2: 6 + 6 + 6 = 18 (stops after 2 compounds)
      expect(result.rolls).toEqual([18])
    })

    test('does not compound non-max values', () => {
      const fixedRollOne = (): number => 6
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifier('compound', true, [5, 3, 4], ctx)

      // No dice show max (6), so no compounding
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifier('compound', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for compound modifier')
    })
  })

  describe('penetrate modifier', () => {
    test('adds rerolled value minus 1 to triggering die', () => {
      const fixedRollOne = (): number => 4
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifier('penetrate', true, [6, 3, 4], ctx)

      // The 6 penetrates: 6 + (4 - 1) = 9
      expect(result.rolls).toEqual([9, 3, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('penetrate')
    })

    test('penetrates multiple times with depth', () => {
      const counter = { value: 0 }
      const sequenceRollOne = (): number => {
        counter.value++
        return counter.value === 1 ? 6 : 3 // First roll is 6 (penetrates again), second is 3
      }
      const ctx: ModifierContext = {
        rollOne: sequenceRollOne,
        parameters: { sides: 6, quantity: 2 }
      }
      const result = applyModifier('penetrate', 5, [6, 4], ctx)

      // The 6 penetrates: 6 + (6 - 1) + (3 - 1) = 6 + 5 + 2 = 13
      expect(result.rolls).toEqual([13, 4])
    })

    test('respects max depth limit', () => {
      const alwaysMaxRoll = (): number => 6
      const ctx: ModifierContext = { rollOne: alwaysMaxRoll, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifier('penetrate', 2, [6], ctx)

      // Depth 2: 6 + (6-1) + (6-1) = 6 + 5 + 5 = 16
      expect(result.rolls).toEqual([16])
    })

    test('does not penetrate non-max values', () => {
      const fixedRollOne = (): number => 6
      const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 3 } }
      const result = applyModifier('penetrate', true, [5, 3, 4], ctx)

      // No dice show max (6), so no penetrating
      expect(result.rolls).toEqual([5, 3, 4])
    })

    test('minimum penetrated value is 1', () => {
      const rollsOne = (): number => 1
      const ctx: ModifierContext = { rollOne: rollsOne, parameters: { sides: 6, quantity: 1 } }
      const result = applyModifier('penetrate', true, [6], ctx)

      // The 6 penetrates: 6 + max(1, 1 - 1) = 6 + 1 = 7 (not 6 + 0)
      expect(result.rolls).toEqual([7])
    })

    test('throws error when context is incomplete', () => {
      const ctx: ModifierContext = {}
      expect(() => {
        applyModifier('penetrate', true, [6, 3, 4], ctx)
      }).toThrow('rollOne function required for penetrate modifier')
    })
  })

  describe('replace modifier', () => {
    test('replaces exact values', () => {
      const result = applyModifier('replace', { from: 1, to: 5 }, [1, 6, 1, 4], mockContext)

      expect(result.rolls).toEqual([5, 6, 5, 4])
      expect(result.log).not.toBeNull()
      expect(result.log?.modifier).toBe('replace')
    })

    test('handles array of replace rules', () => {
      const result = applyModifier(
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
      const result = applyModifier(
        'replace',
        { from: { greaterThan: 5 }, to: 5 },
        [1, 6, 3, 4],
        mockContext
      )

      expect(result.rolls).toEqual([1, 5, 3, 4])
    })
  })
})

describe('direct modifier definition edge cases', () => {
  describe('explode modifier', () => {
    test('parse returns empty object when notation does not match', () => {
      expect(explodeModifier.parse('x')).toEqual({})
    })

    test('toDescription returns empty array for falsy options', () => {
      expect(explodeModifier.toDescription(false)).toEqual([])
    })
  })

  describe('keep modifier', () => {
    test('parse returns empty object when notation does not match', () => {
      expect(keepModifier.parse('xyz')).toEqual({})
    })

    test('toNotation returns undefined for empty options', () => {
      expect(keepModifier.toNotation({})).toBeUndefined()
    })

    test('toDescription returns empty array for empty options', () => {
      expect(keepModifier.toDescription({})).toEqual([])
    })

    test('apply returns unchanged rolls when neither highest nor lowest specified', () => {
      const result = keepModifier.apply([1, 2, 3, 4], {}, mockContext)
      expect(result.rolls).toEqual([1, 2, 3, 4])
    })
  })
})

describe('applyModifier - multiply modifiers', () => {
  test('applies multiply modifier correctly', () => {
    const result = applyModifier('multiply', 2, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(12, [3, 4, 5])).toBe(24) // 12 * 2 = 24
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('multiply')
  })

  test('applies multiplyTotal modifier correctly', () => {
    const result = applyModifier('multiplyTotal', 3, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(15, [3, 4, 5])).toBe(45) // 15 * 3 = 45
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('multiplyTotal')
  })

  test('handles undefined multiply modifier', () => {
    const result = applyModifier('multiply', undefined, [3, 4, 5], mockContext)

    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.transformTotal).toBeUndefined()
    expect(result.log).toBeNull()
  })
})

describe('applyModifier - count modifier', () => {
  const ctx: ModifierContext = { parameters: { sides: 10, quantity: 5 } }

  test('counts dice above threshold', () => {
    const result = applyModifier('count', { greaterThanOrEqual: 7 }, [5, 7, 8, 3, 10], ctx)

    expect(result.rolls).toEqual([5, 7, 8, 3, 10])
    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      // 3 successes: 7, 8, 10 are >= 7
      expect(result.transformTotal(33, [5, 7, 8, 3, 10])).toBe(3)
    }
    expect(result.log).not.toBeNull()
    expect(result.log?.modifier).toBe('count')
  })

  test('counts with deduct (above minus below)', () => {
    const result = applyModifier(
      'count',
      { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true },
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

  test('deduct can make total negative', () => {
    const result = applyModifier(
      'count',
      { greaterThanOrEqual: 10, lessThanOrEqual: 3, deduct: true },
      [1, 2, 3, 4, 5],
      ctx
    )

    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      // 0 successes - 3 botches (1, 2, 3) = -3
      expect(result.transformTotal(15, [1, 2, 3, 4, 5])).toBe(-3)
    }
  })

  test('returns 0 when no dice match', () => {
    const result = applyModifier('count', { greaterThanOrEqual: 10 }, [1, 2, 3, 4, 5], ctx)

    expect(result.transformTotal).toBeDefined()
    if (result.transformTotal) {
      expect(result.transformTotal(15, [1, 2, 3, 4, 5])).toBe(0)
    }
  })
})

describe('applyAllModifiers', () => {
  test('applies multiple modifiers in priority order', () => {
    const fixedRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }

    const result = applyAllModifiers({ drop: { lowest: 1 }, plus: 3 }, [1, 3, 4, 5], ctx)

    // Drop lowest (1) first, then plus 3 via transformTotal
    expect(result.rolls).toEqual([3, 4, 5])
    expect(result.logs.length).toBe(2)
    expect(result.totalTransformers.length).toBe(1)
    // Apply transformer: (3+4+5) + 3 = 15
    const transformer = result.totalTransformers[0]
    expect(transformer?.(12, [3, 4, 5])).toBe(15)
  })

  test('applies modifiers in priority order (reroll before drop)', () => {
    const fixedRollOne = (): number => 5
    const ctx: ModifierContext = { rollOne: fixedRollOne, parameters: { sides: 6, quantity: 4 } }

    const result = applyAllModifiers(
      { reroll: { exact: [1] }, drop: { lowest: 1 } },
      [1, 3, 4, 6],
      ctx
    )

    // Reroll (priority 40) runs before drop (priority 65)
    // Reroll 1 -> 5, pool is [5, 3, 4, 6], then drop lowest (3)
    expect(result.rolls.sort((a, b) => a - b)).toEqual([4, 5, 6])
    expect(result.logs.length).toBe(2)
  })

  test('collects totalTransformers from multiple modifiers', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 2 } }

    const result = applyAllModifiers({ plus: 2, multiply: 3 }, [3, 4], ctx)

    // Both plus and multiply use transformTotal
    expect(result.totalTransformers.length).toBe(2)
    expect(result.rolls).toEqual([3, 4])
  })

  test('handles empty modifiers object', () => {
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 3 } }

    const result = applyAllModifiers({}, [1, 2, 3], ctx)

    expect(result.rolls).toEqual([1, 2, 3])
    expect(result.logs.length).toBe(0)
    expect(result.totalTransformers.length).toBe(0)
  })
})

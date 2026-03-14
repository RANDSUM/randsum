import { describe, expect, test } from 'bun:test'
import { translateModifiers } from '../../src/lib/modifierTranslator'

describe('translateModifiers', () => {
  test('empty modify array returns empty options', () => {
    const result = translateModifiers([], {})
    expect(result.rollerOptions).toEqual({})
    expect(result.manualOps).toEqual([])
  })

  test('keepHighest modifier', () => {
    const result = translateModifiers([{ keepHighest: 3 }], {})
    expect(result.rollerOptions.keep).toEqual({ highest: 3 })
  })

  test('keepLowest modifier', () => {
    const result = translateModifiers([{ keepLowest: 2 }], {})
    expect(result.rollerOptions.keep).toEqual({ lowest: 2 })
  })

  test('add modifier', () => {
    const result = translateModifiers([{ add: 5 }], {})
    expect(result.rollerOptions.plus).toBe(5)
  })

  test('cap modifier with max', () => {
    const result = translateModifiers([{ cap: { max: 6 } }], {})
    expect(result.rollerOptions.cap).toEqual({ greaterThan: 6 })
  })

  test('cap modifier with min', () => {
    const result = translateModifiers([{ cap: { min: 1 } }], {})
    expect(result.rollerOptions.cap).toEqual({ lessThan: 1 })
  })

  test('cap modifier with both min and max', () => {
    const result = translateModifiers([{ cap: { min: 1, max: 6 } }], {})
    expect(result.rollerOptions.cap).toEqual({ greaterThan: 6, lessThan: 1 })
  })

  test('markDice modifier', () => {
    const result = translateModifiers(
      [{ markDice: { operator: '>=' as const, value: 4, flag: 'high' } }],
      {}
    )
    expect(result.manualOps).toEqual([{ type: 'markDice', operator: '>=', value: 4, flag: 'high' }])
  })

  test('keepMarked modifier', () => {
    const result = translateModifiers([{ keepMarked: 'high' }], {})
    expect(result.manualOps).toEqual([{ type: 'keepMarked', flag: 'high' }])
  })

  test('multiple modifiers combined', () => {
    const result = translateModifiers(
      [
        { keepHighest: 3 },
        { add: 2 },
        { markDice: { operator: '=' as const, value: 6, flag: 'sixes' } },
        { keepMarked: 'sixes' }
      ],
      {}
    )
    expect(result.rollerOptions.keep).toEqual({ highest: 3 })
    expect(result.rollerOptions.plus).toBe(2)
    expect(result.manualOps).toHaveLength(2)
  })

  test('$input references resolved from input', () => {
    const result = translateModifiers([{ keepHighest: { $input: 'count' } }], { count: 3 })
    expect(result.rollerOptions.keep).toEqual({ highest: 3 })
  })
})

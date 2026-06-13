import { describe, expect, test } from 'bun:test'
import { modifierToDescription, modifierToNotation } from '../../../src/modifiers/registry'

describe('modifierToDescription', () => {
  test('generates description for plus modifier', () => {
    expect(modifierToDescription('plus', 5)).toEqual(['Add 5'])
  })

  test('generates description for minus modifier', () => {
    expect(modifierToDescription('minus', 3)).toEqual(['Subtract 3'])
  })

  test('generates description for cap modifier', () => {
    const result = modifierToDescription('cap', { greaterThan: 5 })
    expect(result).toEqual(['No Rolls greater than 5'])
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
    expect(result).toEqual(['Reroll 1 and 2'])
  })

  test('generates description for explode modifier', () => {
    const result = modifierToDescription('explode', true)
    expect(result).toEqual(['Exploding Dice'])
  })

  test('generates description for unique modifier', () => {
    const result = modifierToDescription('unique', true)
    expect(result).toEqual(['No Duplicate Rolls'])
  })

  test('generates description for unique modifier with exceptions', () => {
    const result = modifierToDescription('unique', { notUnique: [1, 2] })
    expect(result).toEqual(['No Duplicates (except 1 and 2)'])
  })

  test('generates description for replace modifier', () => {
    const result = modifierToDescription('replace', { from: 1, to: 6 })
    expect(result).toEqual(['Replace 1 with 6'])
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

describe('modifierToNotation', () => {
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

  test('returns undefined for explode modifier when false', () => {
    const result = modifierToNotation('explode', false)
    expect(result).toBeUndefined()
  })

  test('generates notation for unique modifier', () => {
    const result = modifierToNotation('unique', true)
    expect(result).toBe('U')
  })

  test('generates notation for unique modifier with notUnique array', () => {
    const result = modifierToNotation('unique', { notUnique: [1, 6] })
    expect(result).toBe('U{1,6}')
  })

  test('returns undefined for unique modifier when false', () => {
    const result = modifierToNotation('unique', false)
    expect(result).toBeUndefined()
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

  test('generates notation for multiply modifier', () => {
    const result = modifierToNotation('multiply', 2)
    expect(result).toBe('*2')
  })

  test('generates notation for multiplyTotal modifier', () => {
    const result = modifierToNotation('multiplyTotal', 3)
    expect(result).toBe('**3')
  })

  test('generates notation for count modifier', () => {
    const result = modifierToNotation('count', { greaterThanOrEqual: 7 })
    expect(result).toBe('#{>=7}')
  })

  test('generates notation for count modifier with deduct', () => {
    const result = modifierToNotation('count', {
      greaterThanOrEqual: 7,
      lessThanOrEqual: 1,
      deduct: true
    })
    expect(result).toBe('#{>=7,<=1}')
  })
})

describe('modifierToDescription - contains assertions', () => {
  test('generates description for explode modifier', () => {
    const result = modifierToDescription('explode', true)
    expect(result).toContain('Exploding Dice')
  })

  test('returns empty array for explode when false', () => {
    const result = modifierToDescription('explode', false)
    expect(result).toEqual([])
  })

  test('generates description for unique modifier', () => {
    const result = modifierToDescription('unique', true)
    expect(result).toContain('No Duplicate Rolls')
  })

  test('generates description for unique with notUnique array', () => {
    const result = modifierToDescription('unique', { notUnique: [1] })!
    expect(result[0]).toContain('No Duplicates')
    expect(result[0]).toContain('except')
  })

  test('generates description for drop lowest', () => {
    const result = modifierToDescription('drop', { lowest: 1 })!
    expect(result[0]).toContain('Drop')
    expect(result[0]).toContain('lowest')
  })

  test('returns undefined result for undefined options', () => {
    const result = modifierToDescription('plus', undefined)
    expect(result).toBeUndefined()
  })

  test('returns empty array for unique when false', () => {
    const result = modifierToDescription('unique', false)
    expect(result).toEqual([])
  })
})

describe('modifierToDescription - additional modifiers', () => {
  test('generates description for multiply modifier', () => {
    const result = modifierToDescription('multiply', 2)
    expect(result).toEqual(['Multiply dice by 2'])
  })

  test('generates description for multiplyTotal modifier', () => {
    const result = modifierToDescription('multiplyTotal', 3)
    expect(result).toEqual(['Multiply total by 3'])
  })

  test('generates description for count modifier', () => {
    const result = modifierToDescription('count', { greaterThanOrEqual: 7 })
    expect(result).toEqual(['Count dice greater than or equal to 7'])
  })

  test('generates description for count modifier with deduct', () => {
    const result = modifierToDescription('count', {
      greaterThanOrEqual: 7,
      lessThanOrEqual: 1,
      deduct: true
    })
    expect(result).toEqual([
      'Count dice greater than or equal to 7, deduct dice less than or equal to 1'
    ])
  })
})

import { describe, expect, test } from 'bun:test'
import {
  modifiersToDescription,
  modifiersToNotation
} from '../../src/notation/transformers/modifiersToStrings'
import { optionsToDescription } from '../../src/notation/transformers/optionsToDescription'
import { optionsToNotation } from '../../src/notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../../src/notation/transformers/optionsToSidesFaces'

describe('modifiersToNotation', () => {
  test('returns empty string for undefined', () => {
    expect(modifiersToNotation(undefined)).toBe('')
  })

  test('returns empty string for empty object', () => {
    expect(modifiersToNotation({})).toBe('')
  })

  test('formats cap modifier', () => {
    expect(modifiersToNotation({ cap: { greaterThan: 5 } })).toBe('C{>5}')
  })

  test('formats drop modifier', () => {
    expect(modifiersToNotation({ drop: { lowest: 1 } })).toBe('L')
  })

  test('formats keep modifier', () => {
    expect(modifiersToNotation({ keep: { highest: 1 } })).toBe('K')
  })

  test('formats replace modifier', () => {
    expect(modifiersToNotation({ replace: { from: 1, to: 6 } })).toBe('V{1=6}')
  })

  test('formats reroll modifier', () => {
    expect(modifiersToNotation({ reroll: { exact: [1] } })).toBe('R{1}')
  })

  test('formats explode modifier', () => {
    expect(modifiersToNotation({ explode: true })).toBe('!')
  })

  test('formats compound modifier', () => {
    expect(modifiersToNotation({ compound: true })).toBe('!!')
  })

  test('formats penetrate modifier', () => {
    expect(modifiersToNotation({ penetrate: true })).toBe('!p')
  })

  test('formats unique modifier', () => {
    expect(modifiersToNotation({ unique: true })).toBe('U')
  })

  test('formats multiply modifier', () => {
    expect(modifiersToNotation({ multiply: 3 })).toBe('*3')
  })

  test('formats plus modifier', () => {
    expect(modifiersToNotation({ plus: 5 })).toBe('+5')
  })

  test('formats minus modifier', () => {
    expect(modifiersToNotation({ minus: 3 })).toBe('-3')
  })

  test('formats count modifier (successes)', () => {
    expect(modifiersToNotation({ count: { greaterThanOrEqual: 5 } })).toBe('#{>=5}')
  })

  test('formats multiplyTotal modifier', () => {
    expect(modifiersToNotation({ multiplyTotal: 2 })).toBe('**2')
  })

  test('formats multiple modifiers together', () => {
    const result = modifiersToNotation({
      drop: { lowest: 1 },
      plus: 5
    })
    expect(result).toBe('L+5')
  })
})

describe('modifiersToDescription', () => {
  test('returns empty array for undefined', () => {
    expect(modifiersToDescription(undefined)).toEqual([])
  })

  test('returns empty array for empty object', () => {
    expect(modifiersToDescription({})).toEqual([])
  })

  test('describes cap modifier', () => {
    expect(modifiersToDescription({ cap: { greaterThan: 5 } })).toEqual(['No Rolls greater than 5'])
  })

  test('describes drop modifier', () => {
    expect(modifiersToDescription({ drop: { lowest: 1 } })).toEqual(['Drop lowest'])
  })

  test('describes keep modifier', () => {
    expect(modifiersToDescription({ keep: { highest: 1 } })).toEqual(['Keep highest'])
  })

  test('describes replace modifier', () => {
    expect(modifiersToDescription({ replace: { from: 1, to: 6 } })).toEqual(['Replace 1 with 6'])
  })

  test('describes reroll modifier', () => {
    expect(modifiersToDescription({ reroll: { exact: [1] } })).toEqual(['Reroll 1'])
  })

  test('describes explode modifier', () => {
    expect(modifiersToDescription({ explode: true })).toEqual(['Exploding Dice'])
  })

  test('describes compound modifier', () => {
    expect(modifiersToDescription({ compound: true })).toEqual(['Compounding Dice'])
  })

  test('describes penetrate modifier', () => {
    expect(modifiersToDescription({ penetrate: true })).toEqual(['Penetrating Dice'])
  })

  test('describes unique modifier', () => {
    expect(modifiersToDescription({ unique: true })).toEqual(['No Duplicate Rolls'])
  })

  test('describes multiply modifier', () => {
    expect(modifiersToDescription({ multiply: 3 })).toEqual(['Multiply dice by 3'])
  })

  test('describes plus modifier', () => {
    expect(modifiersToDescription({ plus: 5 })).toEqual(['Add 5'])
  })

  test('describes minus modifier', () => {
    expect(modifiersToDescription({ minus: 3 })).toEqual(['Subtract 3'])
  })

  test('describes count modifier (successes)', () => {
    expect(modifiersToDescription({ count: { greaterThanOrEqual: 5 } })).toEqual([
      'Count dice greater than or equal to 5'
    ])
  })

  test('describes multiplyTotal modifier', () => {
    expect(modifiersToDescription({ multiplyTotal: 2 })).toEqual(['Multiply total by 2'])
  })

  test('describes multiple modifiers together', () => {
    const result = modifiersToDescription({
      drop: { lowest: 1 },
      plus: 5
    })
    expect(result).toEqual(['Drop lowest', 'Add 5'])
  })
})

describe('optionsToDescription', () => {
  test('describes basic numeric dice', () => {
    const result = optionsToDescription({ sides: 6 })
    expect(result[0]).toBe('Roll 1 6-sided die')
  })

  test('describes multiple dice (plural)', () => {
    const result = optionsToDescription({ sides: 6, quantity: 4 })
    expect(result[0]).toBe('Roll 4 6-sided dice')
  })

  test('describes custom faces', () => {
    const result = optionsToDescription({
      sides: ['a', 'b', 'c']
    })
    expect(result[0]).toContain('Dice with the following sides')
    expect(result[0]).toContain('a, b, c')
  })

  test('describes custom faces with quantity > 1 (plural)', () => {
    const result = optionsToDescription({
      sides: ['a', 'b', 'c'],
      quantity: 2
    })
    expect(result[0]).toContain('Roll 2 Dice')
    expect(result[0]).toContain('a, b, c')
  })

  test('describes with modifiers', () => {
    const result = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { lowest: 1 } }
    })
    expect(result).toContain('Drop lowest')
  })

  test('describes subtract arithmetic', () => {
    const result = optionsToDescription({
      sides: 6,
      arithmetic: 'subtract'
    })
    expect(result).toContain('and Subtract the result')
  })

  test('does not include arithmetic text for add', () => {
    const result = optionsToDescription({
      sides: 6,
      arithmetic: 'add'
    })
    expect(result.find(s => s.includes('Subtract'))).toBeUndefined()
  })
})

describe('optionsToNotation', () => {
  test('converts basic options to notation', () => {
    expect(optionsToNotation({ sides: 6 })).toBe('1d6')
  })

  test('converts quantity and sides', () => {
    expect(optionsToNotation({ sides: 20, quantity: 2 })).toBe('2d20')
  })

  test('converts with modifiers', () => {
    expect(
      optionsToNotation({
        sides: 6,
        quantity: 4,
        modifiers: { drop: { lowest: 1 } }
      })
    ).toBe('4d6L')
  })

  test('converts custom string faces (uses sides.length)', () => {
    expect(optionsToNotation({ sides: ['a', 'b', 'c', 'd', 'e', 'f'] })).toBe('1d6')
  })

  test('converts subtract arithmetic', () => {
    const result = optionsToNotation({
      sides: 6,
      arithmetic: 'subtract'
    })
    expect(result).toBe('-1d6')
  })

  test('throws NotationParseError for invalid generated notation', () => {
    expect(() => optionsToNotation({ sides: 0 })).toThrow()
  })
})

describe('optionsToSidesFaces', () => {
  test('returns sides for numeric sides', () => {
    expect(optionsToSidesFaces({ sides: 6 })).toEqual({ sides: 6 })
  })

  test('returns sides and faces for array sides', () => {
    expect(optionsToSidesFaces({ sides: ['a', 'b', 'c'] })).toEqual({
      sides: 3,
      faces: ['a', 'b', 'c']
    })
  })

  test('faces is undefined for numeric sides', () => {
    const result = optionsToSidesFaces({ sides: 20 })
    expect(result.faces).toBeUndefined()
  })
})

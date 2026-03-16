import { describe, expect, test } from 'bun:test'
import {
  modifiersToDescription,
  modifiersToNotation
} from '../../src/notation/transformers/modifiersToStrings'
import { optionsToDescription } from '../../src/notation/transformers/optionsToDescription'
import { optionsToNotation } from '../../src/notation/transformers/optionsToNotation'
import { optionsToSidesFaces } from '../../src/notation/transformers/optionsToSidesFaces'

describe('optionsToSidesFaces', () => {
  test('returns sides for numeric sides', () => {
    expect(optionsToSidesFaces({ sides: 6 })).toEqual({ sides: 6 })
  })

  test('returns sides and faces for array sides', () => {
    const result = optionsToSidesFaces({ sides: ['a', 'b', 'c'] })
    expect(result.sides).toBe(3)
    expect(result.faces).toEqual(['a', 'b', 'c'])
  })
})

describe('optionsToNotation', () => {
  test('converts basic options to notation', () => {
    expect(optionsToNotation({ sides: 6, quantity: 2 })).toBe('2d6')
  })

  test('defaults quantity to 1', () => {
    expect(optionsToNotation({ sides: 20 })).toBe('1d20')
  })

  test('includes drop lowest modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })).toBe(
      '4d6L'
    )
  })

  test('includes drop highest modifier', () => {
    expect(optionsToNotation({ sides: 20, quantity: 2, modifiers: { drop: { highest: 1 } } })).toBe(
      '2d20H'
    )
  })

  test('includes plus modifier', () => {
    expect(optionsToNotation({ sides: 20, quantity: 1, modifiers: { plus: 5 } })).toBe('1d20+5')
  })

  test('includes minus modifier', () => {
    expect(optionsToNotation({ sides: 8, quantity: 2, modifiers: { minus: 2 } })).toBe('2d8-2')
  })

  test('includes explode modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 3, modifiers: { explode: true } })).toBe('3d6!')
  })

  test('includes reroll modifier', () => {
    expect(
      optionsToNotation({
        sides: 6,
        quantity: 4,
        modifiers: { reroll: { exact: [1] } }
      })
    ).toBe('4d6R{1}')
  })

  test('includes unique modifier', () => {
    expect(optionsToNotation({ sides: 20, quantity: 5, modifiers: { unique: true } })).toBe('5d20U')
  })

  test('includes cap modifier', () => {
    expect(
      optionsToNotation({
        sides: 20,
        quantity: 4,
        modifiers: { cap: { greaterThan: 18 } }
      })
    ).toBe('4d20C{>18}')
  })

  test('includes replace modifier', () => {
    expect(
      optionsToNotation({
        sides: 6,
        quantity: 3,
        modifiers: { replace: { from: 1, to: 6 } }
      })
    ).toBe('3d6V{1=6}')
  })

  test('includes keep modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 4, modifiers: { keep: { highest: 3 } } })).toBe(
      '4d6K3'
    )
  })

  test('includes compound modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 3, modifiers: { compound: true } })).toBe(
      '3d6!!'
    )
  })

  test('includes penetrate modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 3, modifiers: { penetrate: true } })).toBe(
      '3d6!p'
    )
  })

  test('includes multiply modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 2, modifiers: { multiply: 2 } })).toBe('2d6*2')
  })

  test('includes multiplyTotal modifier', () => {
    expect(optionsToNotation({ sides: 6, quantity: 2, modifiers: { multiplyTotal: 3 } })).toBe(
      '2d6**3'
    )
  })

  test('handles subtract arithmetic', () => {
    expect(optionsToNotation({ sides: 6, quantity: 1, arithmetic: 'subtract' })).toBe('-1d6')
  })

  test('handles multiple modifiers', () => {
    const result = optionsToNotation({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { lowest: 1 }, plus: 3 }
    })
    expect(result).toBe('4d6L+3')
  })
})

describe('optionsToDescription', () => {
  test('describes basic roll', () => {
    const result = optionsToDescription({ sides: 6, quantity: 2 })
    expect(result).toContain('Roll 2 6-sided dice')
  })

  test('uses "die" for single die', () => {
    const result = optionsToDescription({ sides: 20, quantity: 1 })
    expect(result).toContain('Roll 1 20-sided die')
  })

  test('defaults quantity to 1', () => {
    const result = optionsToDescription({ sides: 20 })
    expect(result).toContain('Roll 1 20-sided die')
  })

  test('describes custom faces', () => {
    const result = optionsToDescription({ sides: ['a', 'b', 'c'] })
    expect(result[0]).toContain('Dice with the following sides')
  })

  test('includes modifier descriptions', () => {
    const result = optionsToDescription({
      sides: 6,
      quantity: 4,
      modifiers: { drop: { lowest: 1 } }
    })
    expect(result.some(d => d.includes('Drop lowest'))).toBe(true)
  })

  test('includes subtract description', () => {
    const result = optionsToDescription({ sides: 6, quantity: 1, arithmetic: 'subtract' })
    expect(result.some(d => d.includes('Subtract the result'))).toBe(true)
  })
})

describe('modifiersToNotation', () => {
  test('returns empty string for undefined', () => {
    expect(modifiersToNotation(undefined)).toBe('')
  })

  test('returns empty string for empty modifiers', () => {
    expect(modifiersToNotation({})).toBe('')
  })

  test('formats cap modifier', () => {
    expect(modifiersToNotation({ cap: { greaterThan: 18 } })).toBe('C{>18}')
  })

  test('formats drop modifier', () => {
    expect(modifiersToNotation({ drop: { lowest: 1 } })).toBe('L')
  })

  test('formats keep modifier', () => {
    expect(modifiersToNotation({ keep: { highest: 3 } })).toBe('K3')
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
    expect(modifiersToNotation({ multiply: 2 })).toBe('*2')
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

  test('combines multiple modifiers', () => {
    const result = modifiersToNotation({ drop: { lowest: 1 }, plus: 3 })
    expect(result).toBe('L+3')
  })
})

describe('modifiersToDescription', () => {
  test('returns empty array for undefined', () => {
    expect(modifiersToDescription(undefined)).toEqual([])
  })

  test('returns empty array for empty modifiers', () => {
    expect(modifiersToDescription({})).toEqual([])
  })

  test('describes cap modifier', () => {
    const result = modifiersToDescription({ cap: { greaterThan: 18 } })
    expect(result.some(d => d.includes('No Rolls'))).toBe(true)
  })

  test('describes drop modifier', () => {
    const result = modifiersToDescription({ drop: { lowest: 1 } })
    expect(result).toContain('Drop lowest')
  })

  test('describes keep modifier', () => {
    const result = modifiersToDescription({ keep: { highest: 3 } })
    expect(result).toContain('Keep highest 3')
  })

  test('describes replace modifier', () => {
    const result = modifiersToDescription({ replace: { from: 1, to: 6 } })
    expect(result).toContain('Replace 1 with 6')
  })

  test('describes reroll modifier', () => {
    const result = modifiersToDescription({ reroll: { exact: [1] } })
    expect(result.some(d => d.includes('Reroll'))).toBe(true)
  })

  test('describes explode modifier', () => {
    const result = modifiersToDescription({ explode: true })
    expect(result).toContain('Exploding Dice')
  })

  test('describes compound modifier', () => {
    const result = modifiersToDescription({ compound: true })
    expect(result).toContain('Compounding Dice')
  })

  test('describes penetrate modifier', () => {
    const result = modifiersToDescription({ penetrate: true })
    expect(result).toContain('Penetrating Dice')
  })

  test('describes unique modifier', () => {
    const result = modifiersToDescription({ unique: true })
    expect(result).toContain('No Duplicate Rolls')
  })

  test('describes multiply modifier', () => {
    const result = modifiersToDescription({ multiply: 2 })
    expect(result).toContain('Multiply dice by 2')
  })

  test('describes plus modifier', () => {
    const result = modifiersToDescription({ plus: 5 })
    expect(result).toContain('Add 5')
  })

  test('describes minus modifier', () => {
    const result = modifiersToDescription({ minus: 3 })
    expect(result).toContain('Subtract 3')
  })

  test('describes count modifier (successes)', () => {
    const result = modifiersToDescription({ count: { greaterThanOrEqual: 5 } })
    expect(result.some(d => d.includes('Count dice greater than or equal to'))).toBe(true)
  })

  test('describes multiplyTotal modifier', () => {
    const result = modifiersToDescription({ multiplyTotal: 2 })
    expect(result).toContain('Multiply total by 2')
  })
})

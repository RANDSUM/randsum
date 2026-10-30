import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '@randsum/roller/validate'
import { addDie, adjustConstant, toggleModifier } from '../src/components/roller-app/notationEdits'

describe('roller app keys', () => {
  test('a die adds to a matching pool or starts a new one', () => {
    expect(addDie('', 20)).toBe('1d20')
    expect(addDie('1d20', 20)).toBe('2d20')
    expect(addDie('d20', 20)).toBe('2d20')
    expect(addDie('2d20', 6)).toBe('2d20+1d6')
    expect(addDie('2d20+1d6', 6)).toBe('2d20+2d6')
    expect(addDie('1d20+5', 20)).toBe('1d20+5+1d20')
  })

  test('the constant steps up and down and disappears at zero', () => {
    expect(adjustConstant('1d20', 1)).toBe('1d20+1')
    expect(adjustConstant('1d20+1', 1)).toBe('1d20+2')
    expect(adjustConstant('1d20+1', -1)).toBe('1d20')
    expect(adjustConstant('1d20', -1)).toBe('1d20-1')
    expect(adjustConstant('1d20+1d8', 1)).toBe('1d20+1d8+1')
    expect(adjustConstant('', 1)).toBe('')
  })

  test('modifiers toggle on the last pool, ahead of the constant', () => {
    expect(toggleModifier('4d6', 'L')).toBe('4d6L')
    expect(toggleModifier('4d6L', 'L')).toBe('4d6')
    expect(toggleModifier('2d20+5', 'L')).toBe('2d20L+5')
    expect(toggleModifier('2d6+3', '!')).toBe('2d6!+3')
  })

  test('every key builds notation the roller accepts', () => {
    const built = toggleModifier(adjustConstant(addDie(addDie('', 6), 6), 2), '!')
    expect(built).toBe('2d6!+2')
    expect(isDiceNotation(built)).toBe(true)
    expect(isDiceNotation(toggleModifier('4d6+1', 'L'))).toBe(true)
  })
})

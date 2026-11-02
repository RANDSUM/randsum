import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '@randsum/roller/validate'
import { addDie, adjustConstant, toggleModifier } from '../src/internal/edits'

describe('notation edits', () => {
  test('a die adds to a matching pool or starts a new one', () => {
    expect(addDie('', 20)).toBe('1d20')
    expect(addDie('1d20', 20)).toBe('2d20')
    expect(addDie('d20', 20)).toBe('2d20')
    expect(addDie('2d20', 6)).toBe('2d20+1d6')
    expect(addDie('2d20+1d6', 6)).toBe('2d20+2d6')
    expect(addDie('1d20+5', 20)).toBe('1d20+5+1d20')
  })

  test('a die grows a pool that already has modifiers', () => {
    expect(addDie('4d6L', 6)).toBe('5d6L')
    expect(addDie('1d20!', 20)).toBe('2d20!')
    expect(addDie('3d6R{<3}', 6)).toBe('4d6R{<3}')
    expect(addDie('4d6L', 20)).toBe('4d6L+1d20')
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
    expect(toggleModifier('', 'L')).toBe('')
  })

  test('a drop on a single die rolls two, so it never drops the only die', () => {
    expect(toggleModifier('1d20', 'L')).toBe('2d20L')
    expect(toggleModifier('d20', 'H')).toBe('2d20H')
    expect(toggleModifier('1d20+5', 'L')).toBe('2d20L+5')
    expect(toggleModifier('1d20!', 'L')).toBe('2d20!L')
    expect(toggleModifier('1d20', '!')).toBe('1d20!')
  })

  test('keys chained together build notation the roller accepts', () => {
    const built = toggleModifier(adjustConstant(addDie(addDie('', 6), 6), 2), '!')
    expect(built).toBe('2d6!+2')
    expect(isDiceNotation(built)).toBe(true)
  })
})

import { describe, test, expect } from 'bun:test'
import { appendDie, toggleSimpleModifier, appendValueModifier } from '../../src/lib/notationBuilder'

describe('appendDie', () => {
  test('creates notation from empty string', () => {
    expect(appendDie('', 6)).toBe('1d6')
  })
  test('increments quantity when same die type is at end', () => {
    expect(appendDie('1d6', 6)).toBe('2d6')
    expect(appendDie('2d6', 6)).toBe('3d6')
  })
  test('appends new group when die type differs', () => {
    expect(appendDie('1d6', 20)).toBe('1d6+1d20')
  })
  test('preserves modifiers when incrementing same die', () => {
    expect(appendDie('1d6L', 6)).toBe('2d6L')
  })
  test('increments last group in compound notation', () => {
    expect(appendDie('1d20+1d6', 6)).toBe('1d20+2d6')
  })
})

describe('toggleSimpleModifier', () => {
  test('appends modifier when absent', () => {
    expect(toggleSimpleModifier('2d6', 'L')).toBe('2d6L')
  })
  test('removes modifier when present at end', () => {
    expect(toggleSimpleModifier('2d6L', 'L')).toBe('2d6')
  })
  test('handles H modifier', () => {
    expect(toggleSimpleModifier('4d6', 'H')).toBe('4d6H')
    expect(toggleSimpleModifier('4d6H', 'H')).toBe('4d6')
  })
  test('handles explode modifier', () => {
    expect(toggleSimpleModifier('1d6', '!')).toBe('1d6!')
    expect(toggleSimpleModifier('1d6!', '!')).toBe('1d6')
  })
  test('returns notation unchanged when empty', () => {
    expect(toggleSimpleModifier('', 'L')).toBe('')
  })
})

describe('appendValueModifier', () => {
  test('appends arithmetic suffix', () => {
    expect(appendValueModifier('1d20', '+5')).toBe('1d20+5')
    expect(appendValueModifier('1d20', '-2')).toBe('1d20-2')
  })
})

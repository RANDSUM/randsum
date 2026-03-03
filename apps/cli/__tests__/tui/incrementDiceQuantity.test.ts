import { describe, expect, test } from 'bun:test'
import { incrementDiceQuantity } from '../../src/tui/helpers/incrementDiceQuantity'

describe('incrementDiceQuantity', () => {
  test('returns 1dN when input is empty', () => {
    expect(incrementDiceQuantity('', 8)).toBe('1d8')
  })

  test('increments existing matching die', () => {
    expect(incrementDiceQuantity('1d8', 8)).toBe('2d8')
  })

  test('increments quantity with modifiers after', () => {
    expect(incrementDiceQuantity('2d8+3', 8)).toBe('3d8+3')
  })

  test('appends when die size not found', () => {
    expect(incrementDiceQuantity('2d6', 8)).toBe('2d6+1d8')
  })

  test('is case insensitive', () => {
    expect(incrementDiceQuantity('1D8', 8)).toBe('2D8')
  })

  test('handles d100', () => {
    expect(incrementDiceQuantity('1d100', 100)).toBe('2d100')
  })

  test('increments multi-digit quantity', () => {
    expect(incrementDiceQuantity('10d6', 6)).toBe('11d6')
  })

  test('appends to complex notation', () => {
    expect(incrementDiceQuantity('4d6L+2', 20)).toBe('4d6L+2+1d20')
  })
})

import { describe, expect, test } from 'bun:test'
import { isNumericRollOptions } from '../src/guards'
import type { CustomRollOptions, NumericRollOptions } from '../src/types'

describe('isNumericRollOptions', () => {
  test('returns true for numeric roll options', () => {
    const numericOptions: NumericRollOptions = {
      sides: 20,
      quantity: 1
    }
    expect(isNumericRollOptions(numericOptions)).toBe(true)
  })

  test('returns true for numeric roll options with modifiers', () => {
    const numericOptions: NumericRollOptions = {
      sides: 6,
      quantity: 2,
      modifiers: {
        drop: { lowest: 1 }
      }
    }
    expect(isNumericRollOptions(numericOptions)).toBe(true)
  })

  test('returns false for custom roll options', () => {
    const customOptions: CustomRollOptions = {
      sides: ['Toa', 'Mata', 'Nui'],
      quantity: 1
    }
    expect(isNumericRollOptions(customOptions)).toBe(false)
  })

  test('returns false for custom roll options with modifiers', () => {
    const customOptions: CustomRollOptions = {
      sides: ['Metru', 'Nui'],
      quantity: 2,
      modifiers: {}
    }
    expect(isNumericRollOptions(customOptions)).toBe(false)
  })
})

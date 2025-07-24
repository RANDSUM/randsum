import { describe, expect, test } from 'bun:test'
import { optionsToNotation } from '../../src/lib/transformers'
import { createRollOptions } from '../support/fixtures'

describe(optionsToNotation, () => {
  test('converts basic numeric options to notation', () => {
    const options = createRollOptions()
    const result = optionsToNotation(options)
    expect(result).toBe('1d20')
  })

  test('converts numeric options with quantity to notation', () => {
    const options = createRollOptions({ sides: 6, quantity: 3 })
    const result = optionsToNotation(options)
    expect(result).toBe('3d6')
  })

  test('handles options with drop modifier', () => {
    const options = createRollOptions({
      quantity: 2,
      modifiers: { drop: { lowest: 1 } }
    })
    const result = optionsToNotation(options)
    expect(result).toContain('2d20')
    expect(result).toMatch(/[Ll]/)
  })

  test('handles large negative plus modifiers', () => {
    const options = createRollOptions({
      quantity: 2,
      modifiers: { plus: -3 }
    })
    const result = optionsToNotation(options)
    expect(result).toContain('2d20-3')
  })
})

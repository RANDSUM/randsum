import { describe, expect, spyOn, test } from 'bun:test'
import { optionsToNotation } from '../../src/lib/transformers'
import { createRollOptions } from '../support/fixtures'
import * as notationModule from '../../src/isDiceNotation'
import { NotationParseError } from '../../src/errors'

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

  test('handles subtract arithmetic prefix', () => {
    const options = createRollOptions({
      sides: 6,
      quantity: 2,
      arithmetic: 'subtract'
    })
    const result = optionsToNotation(options)
    expect(result).toBe('-2d6')
  })

  test('handles custom faces (array of strings)', () => {
    const options = {
      sides: ['+', '+', ' ', ' ', '-', '-'],
      quantity: 4
    }
    const result = optionsToNotation(options)
    expect(result).toBe('4d6')
  })

  test('handles default quantity of 1', () => {
    const options = { sides: 20 }
    const result = optionsToNotation(options)
    expect(result).toBe('1d20')
  })

  test('handles multiple modifiers', () => {
    const options = createRollOptions({
      sides: 6,
      quantity: 4,
      modifiers: {
        drop: { lowest: 1 },
        plus: 5
      }
    })
    const result = optionsToNotation(options)
    expect(result).toContain('4d6')
    expect(result).toMatch(/[Ll]/)
    expect(result).toContain('+5')
  })

  test('throws when generated notation is invalid', () => {
    const spy = spyOn(notationModule, 'isDiceNotation').mockReturnValue(false)

    expect(() => optionsToNotation({ sides: 6 })).toThrow(NotationParseError)
    expect(() => optionsToNotation({ sides: 6 })).toThrow('Generated notation is invalid')

    spy.mockRestore()
  })
})

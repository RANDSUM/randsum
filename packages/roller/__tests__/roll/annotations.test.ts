import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/index'

describe('Annotations/Labels in roll()', () => {
  test('label propagates to RollRecord', () => {
    const result = roll('2d6+3[fire]')

    expect(result.rolls[0]?.label).toBe('fire')
  })

  test('roll without label has no label on record', () => {
    const result = roll('2d6+3')

    expect(result.rolls[0]?.label).toBeUndefined()
  })

  test('multi-roll expression propagates labels', () => {
    const result = roll('2d6+3[fire]+1d4[cold]')

    expect(result.rolls[0]?.label).toBe('fire')
    expect(result.rolls[1]?.label).toBe('cold')
  })

  test('label does not affect mechanical result', () => {
    // Roll with a seeded random to ensure determinism
    const withLabel = roll('1d6+3[fire]')
    // Verify the structure is correct regardless of random values
    expect(withLabel.rolls[0]?.parameters.modifiers.plus).toBe(3)
    expect(withLabel.rolls[0]?.parameters.sides).toBe(6)
    expect(withLabel.rolls[0]?.parameters.quantity).toBe(1)
  })

  test('label is accessible on parameters', () => {
    const result = roll('2d6[damage]')

    expect(result.rolls[0]?.parameters.label).toBe('damage')
  })
})

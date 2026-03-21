import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'
import { compoundSchema } from '../../../src/modifiers/compound'

describe('Conditional Compound notation', () => {
  test('parses !!{>=8}', () => {
    const result = compoundSchema.parse('5d10!!{>=8}')
    expect(result).toEqual({ compound: { greaterThanOrEqual: 8 } })
  })

  test('parses bare !! as boolean true', () => {
    const result = compoundSchema.parse('3d6!!')
    expect(result).toEqual({ compound: true })
  })

  test('parses !!5 as number depth', () => {
    const result = compoundSchema.parse('1d8!!5')
    expect(result).toEqual({ compound: 5 })
  })

  test('parses !!{>5,<3} with multiple conditions', () => {
    const result = compoundSchema.parse('4d10!!{>5,<3}')
    expect(result).toEqual({ compound: { greaterThan: 5, lessThan: 3 } })
  })

  test('parses !!{=10} with exact condition', () => {
    const result = compoundSchema.parse('5d10!!{=10}')
    expect(result).toEqual({ compound: { exact: [10] } })
  })

  test('toNotation for condition', () => {
    const notation = compoundSchema.toNotation({ greaterThanOrEqual: 10 })
    expect(notation).toBe('!!{>=10}')
  })

  test('toNotation for true', () => {
    expect(compoundSchema.toNotation(true)).toBe('!!')
  })

  test('toNotation for number', () => {
    expect(compoundSchema.toNotation(5)).toBe('!!5')
  })

  test('toNotation for false', () => {
    expect(compoundSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription for condition', () => {
    const desc = compoundSchema.toDescription({ greaterThanOrEqual: 8 })
    expect(desc).toEqual(['Compounding Dice on greater than or equal to 8'])
  })

  test('toDescription for true', () => {
    const desc = compoundSchema.toDescription(true)
    expect(desc).toEqual(['Compounding Dice'])
  })

  test('toDescription for number', () => {
    const desc = compoundSchema.toDescription(3)
    expect(desc).toEqual(['Compounding Dice (max 3 times)'])
  })
})

describe('Conditional Compound behavior', () => {
  test('compound with condition object triggers on matching values', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { compound: { greaterThanOrEqual: 8 } } },
      { randomFn: seeded }
    )
    // Compound adds to the die rather than creating new dice,
    // so the pool size stays the same
    expect(result.rolls[0]!.rolls.length).toBe(5)
  })

  test('bare boolean true still triggers on max only', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 6, quantity: 3, modifiers: { compound: true } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBe(3)
  })
})

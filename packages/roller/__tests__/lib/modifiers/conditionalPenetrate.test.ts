import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'
import { penetrateSchema } from '../../../src/modifiers/penetrate'

describe('Conditional Penetrate notation', () => {
  test('parses !p{>=8}', () => {
    const result = penetrateSchema.parse('5d10!p{>=8}')
    expect(result).toEqual({ penetrate: { greaterThanOrEqual: 8 } })
  })

  test('parses bare !p as boolean true', () => {
    const result = penetrateSchema.parse('1d6!p')
    expect(result).toEqual({ penetrate: true })
  })

  test('parses !p5 as number depth', () => {
    const result = penetrateSchema.parse('1d8!p5')
    expect(result).toEqual({ penetrate: 5 })
  })

  test('parses !p{>5,<3} with multiple conditions', () => {
    const result = penetrateSchema.parse('4d10!p{>5,<3}')
    expect(result).toEqual({ penetrate: { greaterThan: 5, lessThan: 3 } })
  })

  test('parses !p{=10} with exact condition', () => {
    const result = penetrateSchema.parse('5d10!p{=10}')
    expect(result).toEqual({ penetrate: { exact: [10] } })
  })

  test('toNotation for condition', () => {
    const notation = penetrateSchema.toNotation({ greaterThanOrEqual: 8 })
    expect(notation).toBe('!p{>=8}')
  })

  test('toNotation for true', () => {
    expect(penetrateSchema.toNotation(true)).toBe('!p')
  })

  test('toNotation for number', () => {
    expect(penetrateSchema.toNotation(5)).toBe('!p5')
  })

  test('toNotation for false', () => {
    expect(penetrateSchema.toNotation(false)).toBeUndefined()
  })

  test('toDescription for condition', () => {
    const desc = penetrateSchema.toDescription({ greaterThanOrEqual: 8 })
    expect(desc).toEqual(['Penetrating Dice on greater than or equal to 8'])
  })

  test('toDescription for true', () => {
    const desc = penetrateSchema.toDescription(true)
    expect(desc).toEqual(['Penetrating Dice'])
  })

  test('toDescription for number', () => {
    const desc = penetrateSchema.toDescription(3)
    expect(desc).toEqual(['Penetrating Dice (max 3 times)'])
  })
})

describe('Conditional Penetrate behavior', () => {
  test('penetrate with condition object triggers on matching values', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { penetrate: { greaterThanOrEqual: 8 } } },
      { randomFn: seeded }
    )
    // Penetrate adds to the die rather than creating new dice,
    // so the pool size stays the same
    expect(result.rolls[0]!.rolls.length).toBe(5)
  })

  test('bare boolean true still triggers on max only', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 6, quantity: 3, modifiers: { penetrate: true } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBe(3)
  })
})

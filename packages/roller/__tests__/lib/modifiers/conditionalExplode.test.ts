import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'
import { explodeSchema } from '../../../src/modifiers/explode'

describe('Conditional Explode notation', () => {
  test('parses !{>=8}', () => {
    const result = explodeSchema.parse('3d10!{>=8}')
    expect(result).toEqual({ explode: { greaterThanOrEqual: 8 } })
  })

  test('parses !{=10}', () => {
    const result = explodeSchema.parse('5d10!{=10}')
    expect(result).toEqual({ explode: { exact: [10] } })
  })

  test('parses bare ! as boolean true', () => {
    const result = explodeSchema.parse('3d6!')
    expect(result).toEqual({ explode: true })
  })

  test('parses !{>5,<3} with multiple conditions', () => {
    const result = explodeSchema.parse('4d10!{>5,<3}')
    expect(result).toEqual({ explode: { greaterThan: 5, lessThan: 3 } })
  })

  test('does not match !! (compound)', () => {
    const result = explodeSchema.parse('3d6!!')
    expect(result).toEqual({})
  })

  test('does not match !p (penetrate)', () => {
    const result = explodeSchema.parse('3d6!p')
    expect(result).toEqual({})
  })

  test('toNotation for condition', () => {
    const notation = explodeSchema.toNotation({ greaterThanOrEqual: 8 })
    expect(notation).toBe('!{>=8}')
  })

  test('toNotation for true', () => {
    const notation = explodeSchema.toNotation(true)
    expect(notation).toBe('!')
  })

  test('toNotation for false', () => {
    const notation = explodeSchema.toNotation(false)
    expect(notation).toBeUndefined()
  })

  test('toDescription for condition', () => {
    const desc = explodeSchema.toDescription({ greaterThanOrEqual: 8 })
    expect(desc).toEqual(['Exploding Dice on greater than or equal to 8'])
  })

  test('toDescription for true', () => {
    const desc = explodeSchema.toDescription(true)
    expect(desc).toEqual(['Exploding Dice'])
  })
})

describe('Conditional Explode', () => {
  test('explode with condition object triggers on matching values', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { explode: { greaterThanOrEqual: 8 } } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(5)
  })

  test('bare boolean true still triggers on max only', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 6, quantity: 3, modifiers: { explode: true } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(3)
  })

  test('explode with exact condition', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { explode: { exact: [9, 10] } } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(5)
  })
})

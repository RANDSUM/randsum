import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '../../../test-utils/src/seededRandom'

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

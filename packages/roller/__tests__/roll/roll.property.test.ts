import { describe, test } from 'bun:test'
import fc from 'fast-check'

import { roll } from '../../src/roll'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

describe('roll property-based tests', () => {
  test('results always within bounds for numeric dice', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // sides
        fc.integer({ min: 1, max: 20 }), // quantity
        (sides, quantity) => {
          const result = roll({ sides, quantity })
          return result.total >= quantity && result.total <= quantity * sides
        }
      )
    )
  })

  test('all individual rolls are within valid range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (sides, quantity) => {
          const result = roll({ sides, quantity })
          for (const rollRecord of result.rolls) {
            for (const rollValue of rollRecord.rolls) {
              if (rollValue < 1 || rollValue > sides) {
                return false
              }
            }
          }
          return true
        }
      )
    )
  })

  test('total equals sum of all rolls for single roll group', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 10 }),
        (sides, quantity) => {
          const result = roll({ sides, quantity })
          if (result.rolls.length === 1) {
            const rollRecord = result.rolls[0]
            if (rollRecord) {
              const sum = rollRecord.rolls.reduce((a, b) => a + b, 0)
              return result.total === sum
            }
          }
          return true
        }
      )
    )
  })

  test('drop lowest never increases total vs without modifier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 42, max: 9999 }),
        (sides, quantity, seed) => {
          const seeded = createSeededRandom(seed)
          const withDrop = roll(
            { sides, quantity, modifiers: { drop: { lowest: 1 } } },
            { randomFn: seeded }
          )
          const seeded2 = createSeededRandom(seed)
          const without = roll({ sides, quantity }, { randomFn: seeded2 })
          return withDrop.total <= without.total
        }
      )
    )
  })

  test('unique modifier produces no duplicates when possible', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 2, max: 8 }),
        (sides, quantity) => {
          const result = roll({ sides, quantity, modifiers: { unique: true } })
          const rolls = result.rolls[0]?.rolls ?? []
          return new Set(rolls).size === rolls.length
        }
      )
    )
  })
})

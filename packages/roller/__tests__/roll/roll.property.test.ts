import { describe, test } from 'bun:test'
import fc from 'fast-check'

import { roll } from '../../src/roll'

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
})

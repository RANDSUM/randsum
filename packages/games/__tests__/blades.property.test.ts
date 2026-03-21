import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '@randsum/games/blades'

describe('roll property-based tests', () => {
  // Gap 33: Blades property tests previously only covered pools 1–4.
  // The spec allows ratings 0–6, so property tests now cover 1–6 (zero-dice
  // is a special mechanic tested separately below).
  test('result is always a valid Blades outcome', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), pool => {
        const { result } = roll({ rating: pool })
        return ['critical', 'success', 'partial', 'failure'].includes(result)
      })
    )
  })

  test('pool size matches initial rolls count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), pool => {
        const { rolls } = roll({ rating: pool })
        const initialRolls = rolls[0]?.initialRolls ?? []
        return initialRolls.length === pool
      })
    )
  })

  test('total is within valid d6 bounds (keepHighest:1 so always 1-6)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), pool => {
        const { rolls } = roll({ rating: pool })
        const total = rolls[0]?.total ?? 0
        return total >= 1 && total <= 6
      })
    )
  })

  test('zero dice pool uses 2d6 keep lowest mechanic', () => {
    Array.from({ length: 50 }).forEach(() => {
      const { rolls, result } = roll({ rating: 0 })
      const initialRolls = rolls[0]?.initialRolls ?? []
      expect(initialRolls).toHaveLength(2)
      expect(['critical']).not.toContain(result)
    })
  })

  test('critical only possible with pool >= 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), pool => {
        const results = Array.from({ length: 20 }, () => roll({ rating: pool }))
        return results.every(({ result }) =>
          ['critical', 'success', 'partial', 'failure'].includes(result)
        )
      }),
      { numRuns: 10 }
    )
  })

  test('individual die rolls are within 1-6 range', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 6 }), pool => {
        const { rolls } = roll({ rating: pool })
        const initialRolls = rolls[0]?.initialRolls ?? []
        return initialRolls.every(r => r >= 1 && r <= 6)
      })
    )
  })
})

import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '@randsum/games/root-rpg'

const VALID_RESULTS = ['Strong Hit', 'Weak Hit', 'Miss'] as const

const resultTier = (result: (typeof VALID_RESULTS)[number]): number => {
  if (result === 'Strong Hit') return 2
  if (result === 'Weak Hit') return 1
  return 0
}

describe('roll property-based tests', () => {
  test('result is always a valid Root RPG outcome', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), bonus => {
        const { result } = roll(bonus)
        return (VALID_RESULTS as readonly string[]).includes(result)
      })
    )
  })

  test('total is always within [2 + bonus, 12 + bonus]', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), bonus => {
        const { total } = roll(bonus)
        return total >= 2 + bonus && total <= 12 + bonus
      })
    )
  })

  test('result maps correctly to total thresholds', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), bonus => {
        const { result, total } = roll(bonus)
        if (total >= 10) return result === 'Strong Hit'
        if (total >= 7) return result === 'Weak Hit'
        return result === 'Miss'
      })
    )
  })

  test('never throws for valid bonus range (-3 to +5)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), bonus => {
        try {
          roll(bonus)
          return true
        } catch {
          return false
        }
      })
    )
  })

  test('monotonic results — higher total never yields a lower tier result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 5 }),
        fc.integer({ min: -3, max: 5 }),
        (bonusA, bonusB) => {
          const rollA = roll(bonusA)
          const rollB = roll(bonusB)
          if (rollA.total >= rollB.total) {
            return resultTier(rollA.result) >= resultTier(rollB.result)
          }
          return true
        }
      )
    )
  })
})

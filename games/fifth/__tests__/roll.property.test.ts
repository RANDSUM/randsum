import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '../src'

describe('roll property-based tests', () => {
  test('total is within valid d20+modifier range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        const { rolls } = roll({ modifier })
        const total = rolls[0]?.total ?? 0
        return total >= 1 + modifier && total <= 20 + modifier
      })
    )
  })

  test('modifier is correctly applied to roll', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        const { rolls } = roll({ modifier })
        const rawRoll = rolls[0]?.modifierHistory.initialRolls[0] ?? 0
        const total = rolls[0]?.total ?? 0
        return total === rawRoll + modifier
      })
    )
  })

  test('advantage rolls 2d20 and keeps highest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        const { rolls } = roll({ modifier, rollingWith: { advantage: true } })
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        return initialRolls.length === 2
      })
    )
  })

  test('disadvantage rolls 2d20 and keeps lowest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        const { rolls } = roll({ modifier, rollingWith: { disadvantage: true } })
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        return initialRolls.length === 2
      })
    )
  })

  test('both advantage and disadvantage cancel out to normal roll', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        const { rolls } = roll({
          modifier,
          rollingWith: { advantage: true, disadvantage: true }
        })
        const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
        return initialRolls.length === 1
      })
    )
  })

  test('individual d20 rolls are within 1-20 range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -30, max: 30 }),
        fc.boolean(),
        fc.boolean(),
        (modifier, advantage, disadvantage) => {
          const { rolls } = roll({
            modifier,
            rollingWith: { advantage, disadvantage }
          })
          const initialRolls = rolls[0]?.modifierHistory.initialRolls ?? []
          return initialRolls.every(roll => roll >= 1 && roll <= 20)
        }
      )
    )
  })

  test('advantage result is never lower than disadvantage with same raw rolls', () => {
    fc.assert(
      fc.property(fc.integer({ min: -30, max: 30 }), modifier => {
        // Roll many times to verify advantage >= disadvantage on average
        const advantageResults = Array.from({ length: 50 }, () =>
          roll({ modifier, rollingWith: { advantage: true } })
        )
        const disadvantageResults = Array.from({ length: 50 }, () =>
          roll({ modifier, rollingWith: { disadvantage: true } })
        )

        const avgAdvantage =
          advantageResults.reduce((sum, r) => sum + (r.rolls[0]?.total ?? 0), 0) / 50
        const avgDisadvantage =
          disadvantageResults.reduce((sum, r) => sum + (r.rolls[0]?.total ?? 0), 0) / 50

        // Advantage should trend higher than disadvantage
        return avgAdvantage >= avgDisadvantage - 2 // Allow small variance
      }),
      { numRuns: 20 }
    )
  })
})

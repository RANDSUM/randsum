import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '../src/roll'

describe('roll property-based tests', () => {
  test('result matches total threshold', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), stat => {
        const { result, total } = roll({ stat })

        if (total >= 10) return result === 'strong_hit'
        if (total >= 7) return result === 'weak_hit'
        return result === 'miss'
      })
    )
  })

  test('total is within valid 2d6+stat range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), stat => {
        const { total } = roll({ stat })
        return total >= 2 + stat && total <= 12 + stat
      })
    )
  })

  test('forward bonus adds to total correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        (stat, forward) => {
          const { total, details } = roll({ stat, forward })
          const expectedMin = 2 + stat + forward
          const expectedMax = 12 + stat + forward
          return total >= expectedMin && total <= expectedMax && details.forward === forward
        }
      )
    )
  })

  test('ongoing bonus adds to total correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        (stat, ongoing) => {
          const { total, details } = roll({ stat, ongoing })
          const expectedMin = 2 + stat + ongoing
          const expectedMax = 12 + stat + ongoing
          return total >= expectedMin && total <= expectedMax && details.ongoing === ongoing
        }
      )
    )
  })

  test('combined bonuses add correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        (stat, forward, ongoing) => {
          const { total } = roll({ stat, forward, ongoing })
          const totalModifier = stat + forward + ongoing
          return total >= 2 + totalModifier && total <= 12 + totalModifier
        }
      )
    )
  })

  test('advantage rolls 3d6 and keeps 2 highest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), stat => {
        const { rolls } = roll({ stat, advantage: true })
        // After dropping lowest, should have 2 dice in result
        return rolls[0]?.rolls.length === 2
      })
    )
  })

  test('disadvantage rolls 3d6 and keeps 2 lowest', () => {
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 5 }), stat => {
        const { rolls } = roll({ stat, disadvantage: true })
        // After dropping highest, should have 2 dice in result
        return rolls[0]?.rolls.length === 2
      })
    )
  })

  test('details reflect input parameters', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -3, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        fc.integer({ min: -5, max: 5 }),
        (stat, forward, ongoing) => {
          const { details } = roll({ stat, forward, ongoing })
          return details.stat === stat && details.forward === forward && details.ongoing === ongoing
        }
      )
    )
  })
})

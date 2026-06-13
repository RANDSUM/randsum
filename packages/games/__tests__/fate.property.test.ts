import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '@randsum/games/fate'

const LADDER = [
  'Legendary',
  'Epic',
  'Fantastic',
  'Superb',
  'Great',
  'Good',
  'Fair',
  'Average',
  'Mediocre',
  'Poor',
  'Terrible'
]

describe('roll property-based tests', () => {
  test('result is always a valid Fate ladder rung', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2, max: 4 }), modifier => {
        const { result } = roll({ modifier })
        return LADDER.includes(result)
      })
    )
  })

  test('four Fate dice are always rolled', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2, max: 4 }), modifier => {
        const { rolls } = roll({ modifier })
        return rolls[0]?.initialRolls.length === 4
      })
    )
  })

  test('each Fate die is -1, 0, or +1', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2, max: 4 }), modifier => {
        const { rolls } = roll({ modifier })
        return (rolls[0]?.initialRolls ?? []).every(d => d === -1 || d === 0 || d === 1)
      })
    )
  })

  test('total equals the dice sum plus the modifier', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2, max: 4 }), modifier => {
        const { total, rolls } = roll({ modifier })
        const diceTotal = (rolls[0]?.initialRolls ?? []).reduce((s, v) => s + v, 0)
        return total === diceTotal + modifier
      })
    )
  })

  test('total stays within the [-4 + modifier, 4 + modifier] envelope', () => {
    fc.assert(
      fc.property(fc.integer({ min: -2, max: 4 }), modifier => {
        const { total } = roll({ modifier })
        return total >= -4 + modifier && total <= 4 + modifier
      })
    )
  })
})

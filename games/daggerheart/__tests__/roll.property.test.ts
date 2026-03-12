import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { roll } from '@randsum/daggerheart'

describe('roll property-based tests', () => {
  test('result is always a valid Daggerheart outcome', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { result } = roll({ modifier })
        return ['hope', 'fear', 'critical hope'].includes(result)
      })
    )
  })

  test('hope and fear rolls are within d12 bounds without amplify', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier })
        if (!details) return false
        return (
          details.hope.roll >= 1 &&
          details.hope.roll <= 12 &&
          details.fear.roll >= 1 &&
          details.fear.roll <= 12
        )
      })
    )
  })

  test('amplifyHope allows rolls up to 20', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier, amplifyHope: true })
        if (!details) return false
        return (
          details.hope.roll >= 1 &&
          details.hope.roll <= 20 &&
          details.hope.amplified &&
          details.fear.roll >= 1 &&
          details.fear.roll <= 12 &&
          !details.fear.amplified
        )
      })
    )
  })

  test('amplifyFear allows rolls up to 20', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier, amplifyFear: true })
        if (!details) return false
        return (
          details.fear.roll >= 1 &&
          details.fear.roll <= 20 &&
          details.fear.amplified &&
          details.hope.roll >= 1 &&
          details.hope.roll <= 12 &&
          !details.hope.amplified
        )
      })
    )
  })

  test('both amplify options work together', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier, amplifyHope: true, amplifyFear: true })
        if (!details) return false
        return (
          details.hope.roll >= 1 &&
          details.hope.roll <= 20 &&
          details.hope.amplified &&
          details.fear.roll >= 1 &&
          details.fear.roll <= 20 &&
          details.fear.amplified
        )
      })
    )
  })

  test('modifier is correctly reflected in details', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier })
        return details?.modifier === modifier
      })
    )
  })

  test('advantage adds d6 to total', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier, rollingWith: 'Advantage' })
        if (!details?.extraDie) return false
        return details.extraDie.advantageRoll >= 1 && details.extraDie.advantageRoll <= 6
      })
    )
  })

  test('disadvantage subtracts d6 from total', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier, rollingWith: 'Disadvantage' })
        if (!details?.extraDie) return false
        return details.extraDie.disadvantageRoll >= 1 && details.extraDie.disadvantageRoll <= 6
      })
    )
  })

  test('extraDie is undefined when rollingWith is not set', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = roll({ modifier })
        return details?.extraDie === undefined
      })
    )
  })
})

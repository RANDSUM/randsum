import { describe, test } from 'bun:test'
import fc from 'fast-check'
import { rollDaggerheart } from '../src/rollDaggerheart'

describe('rollDaggerheart property-based tests', () => {
  test('result is always a valid Daggerheart outcome', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { result } = rollDaggerheart({ modifier })
        return ['hope', 'fear', 'critical hope'].includes(result)
      })
    )
  })

  test('hope and fear rolls are within d12 bounds without amplify', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier })
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
        const { details } = rollDaggerheart({ modifier, amplifyHope: true })
        if (!details) return false
        // Hope can be 1-20, fear stays 1-12
        return (
          details.hope.roll >= 1 &&
          details.hope.roll <= 20 &&
          details.hope.amplified === true &&
          details.fear.roll >= 1 &&
          details.fear.roll <= 12 &&
          details.fear.amplified === false
        )
      })
    )
  })

  test('amplifyFear allows rolls up to 20', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier, amplifyFear: true })
        if (!details) return false
        // Fear can be 1-20, hope stays 1-12
        return (
          details.fear.roll >= 1 &&
          details.fear.roll <= 20 &&
          details.fear.amplified === true &&
          details.hope.roll >= 1 &&
          details.hope.roll <= 12 &&
          details.hope.amplified === false
        )
      })
    )
  })

  test('both amplify options work together', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier, amplifyHope: true, amplifyFear: true })
        if (!details) return false
        return (
          details.hope.roll >= 1 &&
          details.hope.roll <= 20 &&
          details.hope.amplified === true &&
          details.fear.roll >= 1 &&
          details.fear.roll <= 20 &&
          details.fear.amplified === true
        )
      })
    )
  })

  test('modifier is correctly reflected in details', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier })
        return details?.modifier === modifier
      })
    )
  })

  test('advantage adds d6 to total', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier, rollingWith: 'Advantage' })
        if (!details?.advantage) return false
        // Advantage roll should be 1-6
        return details.advantage.roll >= 1 && details.advantage.roll <= 6
      })
    )
  })

  test('disadvantage subtracts d6 from total', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier, rollingWith: 'Disadvantage' })
        if (!details?.advantage) return false
        // Disadvantage roll should be -6 to -1
        return details.advantage.roll >= -6 && details.advantage.roll <= -1
      })
    )
  })

  test('no advantage when not specified', () => {
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 20 }), modifier => {
        const { details } = rollDaggerheart({ modifier })
        return details?.advantage === undefined
      })
    )
  })
})

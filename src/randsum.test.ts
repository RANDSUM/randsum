import randsum from '.'
import { Randomizer, RollResult } from 'types'

const randsumSimpleTests = (result: number) => {
  test('returns a number as total', () => {
    expect(Number.isInteger(result)).toBe(true)
  })
}

const mockRandomizerRoll = 420
const mockRandomizer: Randomizer = () => mockRandomizerRoll
const randsumCustomRandomizerSimpleTests = (result: number, rolls: number) => {
  test('returns a number as total', () => {
    expect(Number.isInteger(result)).toBe(true)
  })

  test('expects total to be correct', () => {
    expect(result).toEqual(rolls * mockRandomizerRoll)
  })
}

const randsumDetailedTests = (result: RollResult, sides: number, rolls: number) => {
  test('result.rollTotals returns an array of results as rolls', () => {
    expect(result.rollTotals.length).toEqual(rolls)

    result.rollTotals.forEach(result => {
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  test('result.sides returns the number of sides of the dice rolled', () => {
    expect(result.sides).toEqual(sides)
  })

  test('result.rolls returns the number of dice rolled', () => {
    expect(result.rolls).toEqual(rolls)
  })

  test('result.modifyRolls returns a function that accepts a callback that gets passed the rollTotals', () => {
    expect(result.modifyInitialRoll(rolls => 40 * rolls.length)).toEqual(rolls * 40)
  })
  test('result.modifyRolls returns a function that accepts a callback that gets passed the rollTotals', () => {
    expect(result.modifyModifiedRoll(rolls => 40 * rolls.length)).toEqual(rolls * 40)
  })
}

describe('Randsum', () => {
  describe('with a string', () => {
    randsumSimpleTests(randsum('20'))
  })

  describe('with a number', () => {
    randsumSimpleTests(randsum(20))
  })

  describe('with a modifier object', () => {
    randsumSimpleTests(randsum({ sides: 20, rolls: 2, drop: { highest: 1 } }))
  })

  describe('with basic dice notation', () => {
    randsumSimpleTests(randsum('2d20'))
  })

  describe('with a custom randomizer', () => {
    randsumCustomRandomizerSimpleTests(randsum('2d20', { customRandomizer: mockRandomizer }), 2)
  })

  describe('with a detailed report', () => {
    randsumDetailedTests(randsum('2d20', { detailed: true }), 20, 2)
  })

  describe('when provided a rollsTotal', () => {
    test('it returns that rollsTotal and uses it for calculations', () => {
      const rollTotals = [20, 20, 20, 20]
      const result = randsum({ sides: 20, rolls: 4, rollTotals }, { detailed: true })

      expect(result.rollTotals).toEqual(rollTotals)
    })
  })
})

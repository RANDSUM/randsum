import { describe, expect, test } from 'bun:test'
import { D } from '../src/D'

describe('D', () => {
  test('.sides returns the number given as sides', () => {
    const sides = 6
    const die = new D(sides)

    expect(die.sides).toEqual(sides)
  })

  test('.roll() returns a number included in the constructor', () => {
    const sides = 6
    const die = new D(sides)

    expect([1, 2, 3, 4, 5, 6]).toContain(die.roll())
  })

  test('.rollMany() returns an array of numbers ', () => {
    const sides = 6
    const die = new D(sides)
    const quantity = 10
    const rolls = die.rollMany(quantity)

    expect(rolls.length).toEqual(quantity)
    rolls.forEach((roll) => expect([1, 2, 3, 4, 5, 6]).toContain(roll))
  })

  test('toConfig() returns a RollConfig object', () => {
    const sides = 6
    const die = new D(sides)
    const config = die.toRollConfig()

    expect(config).toEqual({
      sides,
      quantity: 1
    })
  })
})

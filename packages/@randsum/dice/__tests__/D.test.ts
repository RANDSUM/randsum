import { describe, expect, test } from 'bun:test'
import { D } from '../src/D'

describe('D', () => {
  const sides = 6
  const die = new D(sides)

  test('.sides returns the number given as sides', () => {
    expect(die.sides).toEqual(sides)
  })

  test('.roll() returns a number included in the constructor', () => {
    expect([1, 2, 3, 4, 5, 6]).toContain(die.roll())
  })
})

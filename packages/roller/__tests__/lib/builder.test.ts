import { describe, expect, test } from 'bun:test'
import { d } from '../../src/lib/builder'

describe('DiceBuilder', () => {
  test('d(6).build() produces valid RollOptions', () => {
    const options = d(6).build()
    expect(options.sides).toBe(6)
    expect(options.quantity).toBe(1)
  })

  test('quantity() sets quantity', () => {
    expect(d(6).quantity(4).build().quantity).toBe(4)
  })

  test('drop(n) adds drop.lowest modifier', () => {
    expect(d(6).quantity(4).drop(1).build().modifiers?.drop).toEqual({ lowest: 1 })
  })

  test('plus(n) adds plus modifier', () => {
    expect(d(6).plus(5).build().modifiers?.plus).toBe(5)
  })

  test('chained builder is immutable (original unchanged)', () => {
    const base = d(6).quantity(4)
    const withDrop = base.drop(1)
    expect(base.build().modifiers?.drop).toBeUndefined()
    expect(withDrop.build().modifiers?.drop).toBeDefined()
  })

  test('toRoll() executes the roll', () => {
    const result = d(6).quantity(4).toRoll()
    expect(result.rolls[0]?.rolls.length).toBe(4)
  })

  test('complex chain: d(6).quantity(4).drop(1).cap({ greaterThan: 5 }).plus(2)', () => {
    const options = d(6).quantity(4).drop(1).cap({ greaterThan: 5 }).plus(2).build()
    expect(options.sides).toBe(6)
    expect(options.quantity).toBe(4)
    expect(options.modifiers?.drop).toEqual({ lowest: 1 })
    expect(options.modifiers?.cap).toEqual({ greaterThan: 5 })
    expect(options.modifiers?.plus).toBe(2)
  })

  test('dropHighest(n) adds drop.highest modifier', () => {
    expect(d(6).quantity(4).dropHighest(2).build().modifiers?.drop).toEqual({ highest: 2 })
  })

  test('keep(highest) adds keep.highest modifier', () => {
    expect(d(6).quantity(4).keep(3).build().modifiers?.keep).toEqual({ highest: 3 })
  })

  test('keepLowest(n) adds keep.lowest modifier', () => {
    expect(d(6).quantity(4).keepLowest(2).build().modifiers?.keep).toEqual({ lowest: 2 })
  })

  test('minus(n) adds minus modifier', () => {
    expect(d(6).minus(5).build().modifiers?.minus).toBe(5)
  })

  test('reroll(options) adds reroll modifier', () => {
    expect(
      d(6)
        .reroll({ exact: [1] })
        .build().modifiers?.reroll
    ).toEqual({ exact: [1] })
  })

  test('explode() adds explode modifier', () => {
    expect(d(6).explode().build().modifiers?.explode).toBe(true)
  })

  test('unique() adds unique modifier', () => {
    expect(d(6).quantity(4).unique().build().modifiers?.unique).toBe(true)
  })

  test('chain: quantity + dropHighest + reroll executes', () => {
    const result = d(6)
      .quantity(4)
      .dropHighest(1)
      .reroll({ exact: [1] })
      .toRoll()
    expect(result.rolls[0]?.rolls.length).toBeLessThanOrEqual(4)
  })
})

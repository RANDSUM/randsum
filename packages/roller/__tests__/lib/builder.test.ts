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
})

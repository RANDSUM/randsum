import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'

describe('modifier interactions', () => {
  describe('drop + keep on same pool', () => {
    test('drop 1 lowest (priority 20) then keep 2 highest (priority 21) from 4d6 = 2 dice', () => {
      const result = roll({
        sides: 6,
        quantity: 4,
        modifiers: { drop: { lowest: 1 }, keep: { highest: 2 } }
      })
      expect(result.rolls[0]?.rolls.length).toBe(2)
    })
  })

  describe('arithmetic modifier ordering', () => {
    test('multiply (*) applies before plus, multiplyTotal (**) applies last', () => {
      const result = roll({
        sides: 1,
        quantity: 2,
        modifiers: { multiply: 3, plus: 4, multiplyTotal: 2 }
      })
      expect(result.total).toBe(20)
    })
  })

  describe('explode + drop interaction', () => {
    test('drop applies after explosions, leaving at least 3 dice in pool', () => {
      const result = roll({
        sides: 6,
        quantity: 4,
        modifiers: { explode: true, drop: { lowest: 1 } }
      })
      expect(result.rolls[0]?.rolls.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('count + arithmetic', () => {
    test('count (priority 95) overwrites plus (priority 90) total', () => {
      const result = roll({
        sides: 1,
        quantity: 4,
        modifiers: { count: { greaterThanOrEqual: 1 }, plus: 2 }
      })
      expect(result.total).toBe(4)
    })

    test('count with deduct subtracts botches', () => {
      const result = roll({
        sides: 1,
        quantity: 4,
        modifiers: { count: { greaterThanOrEqual: 6, lessThanOrEqual: 1, deduct: true } }
      })
      expect(result.total).toBe(-4)
    })
  })

  describe('unique + reroll', () => {
    test('unique and reroll can coexist without error on valid input', () => {
      const result = roll({
        sides: 6,
        quantity: 3,
        modifiers: { unique: true, reroll: { exact: [1] } }
      })
      const rolls = result.rolls[0]?.rolls ?? []
      const uniqueSet = new Set(rolls)
      expect(uniqueSet.size).toBe(rolls.length)
    })
  })

  describe('cap + reroll priority', () => {
    test('cap (priority 10) applies before reroll (priority 40), so reroll sees capped values', () => {
      const result = roll({
        sides: 1,
        quantity: 2,
        modifiers: { cap: { greaterThan: 0 }, reroll: { exact: [1] } }
      })
      expect(result).toBeDefined()
      expect(result.total).toBe(0)
    })
  })
})

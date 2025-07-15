import { describe, expect, test } from 'bun:test'
import { type FifthRollArgument, d20Roll } from '../src'

describe(d20Roll, () => {
  describe('basic roll', () => {
    const args: FifthRollArgument = { modifier: 5 }

    test('returns a result within valid range', () => {
      const rollResult = d20Roll(args)
      expect(rollResult.details.total).toBeGreaterThanOrEqual(6)
      expect(rollResult.details.total).toBeLessThanOrEqual(25)
    })

    test('applies modifier correctly', () => {
      const rollResult = d20Roll(args)
      const rawRoll = rollResult.details.history.initialRolls[0]
      expect(rollResult.details.total).toBe(Number(rawRoll) + args.modifier)
    })

    test('returns single roll result', () => {
      const rollResult = d20Roll(args)
      expect(rollResult.details.history.initialRolls).toHaveLength(1)
    })
  })

  describe('with advantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { advantage: true }
    }

    test('returns two rolls', () => {
      const result = d20Roll(args)
      expect(result.details.history.initialRolls).toHaveLength(2)
    })

    test('uses higher roll for total', () => {
      const result = d20Roll(args)
      const [roll1, roll2] = result.details.history.initialRolls
      const expectedTotal =
        Math.max(Number(roll1), Number(roll2)) + args.modifier
      expect(result.details.total).toBe(expectedTotal)
    })
  })

  describe('with disadvantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { disadvantage: true }
    }

    test('returns two rolls', () => {
      const result = d20Roll(args)
      expect(result.details.history.initialRolls).toHaveLength(2)
    })

    test('uses lower roll for total', () => {
      const result = d20Roll(args)
      const [roll1, roll2] = result.details.history.initialRolls
      const expectedTotal =
        Math.min(Number(roll1), Number(roll2)) + args.modifier
      expect(result.details.total).toBe(expectedTotal)
    })
  })

  describe('with both advantage and disadvantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { advantage: true, disadvantage: true }
    }

    test('returns single roll result', () => {
      const result = d20Roll(args)
      expect(result.details.history.initialRolls).toHaveLength(1)
    })

    test('applies modifier correctly', () => {
      const result = d20Roll(args)
      const rawRoll = result.details.history.initialRolls[0]
      expect(result.details.total).toBe(Number(rawRoll) + args.modifier)
    })
  })

  describe('with negative modifier', () => {
    const args: FifthRollArgument = { modifier: -3 }

    test('returns a result within valid range', () => {
      const result = d20Roll(args)
      expect(result.details.total).toBeGreaterThanOrEqual(-2)
      expect(result.details.total).toBeLessThanOrEqual(17)
    })

    test('applies negative modifier correctly', () => {
      const result = d20Roll(args)
      const rawRoll = result.details.history.initialRolls[0]
      expect(result.details.total).toBe(Number(rawRoll) + args.modifier)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { type FifthRollArgument, actionRoll } from '../src'

describe('actionRoll', () => {
  describe('basic roll', () => {
    const args: FifthRollArgument = { modifier: 5 }

    test('returns a total within valid range', () => {
      const rollResult = actionRoll(args)
      expect(rollResult.total).toBeGreaterThanOrEqual(6)
      expect(rollResult.total).toBeLessThanOrEqual(25)
    })

    test('applies modifier correctly', () => {
      const rollResult = actionRoll(args)
      const rawRoll = rollResult.rolls[0]?.modifierHistory.initialRolls[0]
      expect(rollResult.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })

    test('returns single roll result', () => {
      const rollResult = actionRoll(args)
      expect(rollResult.rolls[0]?.modifierHistory.initialRolls).toHaveLength(1)
    })
  })

  describe('with advantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { advantage: true }
    }

    test('returns two rolls', () => {
      const result = actionRoll(args)
      expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
    })

    test('uses higher roll for total', () => {
      const result = actionRoll(args)
      const rolls = result.rolls[0]?.modifierHistory.initialRolls ?? []
      const expectedTotal = Math.max(Number(rolls[0]), Number(rolls[1])) + args.modifier
      expect(result.rolls[0]?.total).toBe(expectedTotal)
    })
  })

  describe('with disadvantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { disadvantage: true }
    }

    test('returns two rolls', () => {
      const result = actionRoll(args)
      expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
    })

    test('uses lower roll for total', () => {
      const result = actionRoll(args)
      const rolls = result.rolls[0]?.modifierHistory.initialRolls ?? []
      const expectedTotal = Math.min(Number(rolls[0]), Number(rolls[1])) + args.modifier
      expect(result.rolls[0]?.total).toBe(expectedTotal)
    })
  })

  describe('with both advantage and disadvantage', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { advantage: true, disadvantage: true }
    }

    test('returns single roll result', () => {
      const result = actionRoll(args)
      expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(1)
    })

    test('applies modifier correctly', () => {
      const result = actionRoll(args)
      const rawRoll = result.rolls[0]?.modifierHistory.initialRolls[0]
      expect(result.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })
  })

  describe('with negative modifier', () => {
    const args: FifthRollArgument = { modifier: -3 }

    test('returns a result within valid range', () => {
      const result = actionRoll(args)
      expect(result.rolls[0]?.total).toBeGreaterThanOrEqual(-2)
      expect(result.rolls[0]?.total).toBeLessThanOrEqual(17)
    })

    test('applies negative modifier correctly', () => {
      const result = actionRoll(args)
      const rawRoll = result.rolls[0]?.modifierHistory.initialRolls[0]
      expect(result.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })
  })
})

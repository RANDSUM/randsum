import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'
import type { RollArgument } from '../src/types'

describe('roll', () => {
  describe('basic roll', () => {
    const args: RollArgument = { modifier: 5 }

    test('returns a result within valid range', () => {
      const result = roll(args)
      expect(result.total).toBeGreaterThanOrEqual(6)
      expect(result.total).toBeLessThanOrEqual(25)
    })

    test('applies modifier correctly', () => {
      const result = roll(args)
      const rawRoll = result.modifiedRolls.rawRolls[0]
      expect(result.total).toBe(Number(rawRoll) + args.modifier)
    })

    test('returns single roll result', () => {
      const result = roll(args)
      expect(result.modifiedRolls.rawRolls).toHaveLength(1)
    })
  })

  describe('with advantage', () => {
    const args: RollArgument = {
      modifier: 5,
      rollingWith: 'Advantage'
    }

    test('returns two rolls', () => {
      const result = roll(args)
      expect(result.modifiedRolls.rawRolls).toHaveLength(2)
    })

    test('uses higher roll for total', () => {
      const result = roll(args)
      const [roll1, roll2] = result.modifiedRolls.rawRolls
      const expectedTotal =
        Math.max(Number(roll1), Number(roll2)) + args.modifier
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('with disadvantage', () => {
    const args: RollArgument = {
      modifier: 5,
      rollingWith: 'Disadvantage'
    }

    test('returns two rolls', () => {
      const result = roll(args)
      expect(result.modifiedRolls.rawRolls).toHaveLength(2)
    })

    test('uses lower roll for total', () => {
      const result = roll(args)
      const [roll1, roll2] = result.modifiedRolls.rawRolls
      const expectedTotal =
        Math.min(Number(roll1), Number(roll2)) + args.modifier
      expect(result.total).toBe(expectedTotal)
    })
  })

  describe('with negative modifier', () => {
    const args: RollArgument = { modifier: -3 }

    test('returns a result within valid range', () => {
      const result = roll(args)
      expect(result.total).toBeGreaterThanOrEqual(-2)
      expect(result.total).toBeLessThanOrEqual(17)
    })

    test('applies negative modifier correctly', () => {
      const result = roll(args)
      const rawRoll = result.modifiedRolls.rawRolls[0]
      expect(result.total).toBe(Number(rawRoll) + args.modifier)
    })
  })
})

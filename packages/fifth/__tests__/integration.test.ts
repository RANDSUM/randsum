import { describe, expect, test } from 'bun:test'
import { actionRoll } from '../src'
import type { FifthRollArgument } from '../src'

describe('actionRoll integration with roller', () => {
  test('uses roller with correct parameters for basic roll', () => {
    const result = actionRoll({ modifier: 5 })

    // Verify it returns a valid result
    expect(result.total).toBeGreaterThanOrEqual(6)
    expect(result.total).toBeLessThanOrEqual(25)
    expect(result.rolls).toHaveLength(1)
    expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(1)
  })

  test('uses roller with advantage correctly', () => {
    const args: FifthRollArgument = {
      modifier: 5,
      rollingWith: { advantage: true }
    }

    const result = actionRoll(args)

    // Verify advantage mechanics
    expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
    const rolls = result.rolls[0]?.modifierHistory.initialRolls ?? []
    const expectedTotal = Math.max(Number(rolls[0]), Number(rolls[1])) + args.modifier
    expect(result.rolls[0]?.total).toBe(expectedTotal)
  })

  test('uses roller with disadvantage correctly', () => {
    const args: FifthRollArgument = {
      modifier: 3,
      rollingWith: { disadvantage: true }
    }

    const result = actionRoll(args)

    // Verify disadvantage mechanics
    expect(result.rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
    const rolls = result.rolls[0]?.modifierHistory.initialRolls ?? []
    const expectedTotal = Math.min(Number(rolls[0]), Number(rolls[1])) + args.modifier
    expect(result.rolls[0]?.total).toBe(expectedTotal)
  })
})

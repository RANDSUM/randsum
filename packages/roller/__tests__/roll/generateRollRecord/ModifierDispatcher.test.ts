import { describe, expect, test } from 'bun:test'
import {
  type ModifierContext,
  ModifierDispatcher
} from '../../../src/roll/generateRollRecord/ModifierDispatcher'
import type { ModifierOptions, NumericRollBonus } from '../../../src/types'

describe('ModifierDispatcher', () => {
  const mockContext: ModifierContext = {
    sides: 6,
    quantity: 2,
    rollOne: () => 3
  }

  const baseBonuses: NumericRollBonus = {
    rolls: [1, 2, 3, 4],
    simpleMathModifier: 0,
    logs: []
  }

  describe('polymorphic dispatch', () => {
    test('dispatches plus modifier correctly', () => {
      const result = ModifierDispatcher.dispatch(
        'plus',
        5,
        baseBonuses,
        mockContext
      )

      expect(result).toEqual({
        rolls: [1, 2, 3, 4],
        simpleMathModifier: 5,
        logs: []
      })
    })

    test('dispatches minus modifier correctly', () => {
      const result = ModifierDispatcher.dispatch(
        'minus',
        3,
        baseBonuses,
        mockContext
      )

      expect(result).toEqual({
        rolls: [1, 2, 3, 4],
        simpleMathModifier: -3,
        logs: []
      })
    })

    test('dispatches drop modifier correctly', () => {
      const result = ModifierDispatcher.dispatch(
        'drop',
        { lowest: 1 },
        baseBonuses,
        mockContext
      )

      expect(result.rolls).toEqual([2, 3, 4])
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('drop')
    })

    test('dispatches explode modifier correctly', () => {
      const bonusesWithMaxRoll: NumericRollBonus = {
        rolls: [6, 2, 3],
        simpleMathModifier: 0,
        logs: []
      }

      const result = ModifierDispatcher.dispatch(
        'explode',
        true,
        bonusesWithMaxRoll,
        mockContext
      )

      expect(result.rolls).toHaveLength(4) // Original 3 + 1 exploded
      expect(result.rolls.slice(0, 3)).toEqual([6, 2, 3])
      expect(result.rolls[3]).toBe(3) // From mockContext.rollOne
      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]?.modifier).toBe('explode')
    })

    test('throws error for unknown modifier', () => {
      expect(() => {
        ModifierDispatcher.dispatch(
          'unknown' as keyof ModifierOptions,
          5,
          baseBonuses,
          mockContext
        )
      }).toThrow('Unknown modifier: unknown')
    })
  })

  describe('behavior consistency', () => {
    test('plus and minus modifiers maintain original behavior without logs', () => {
      const plusResult = ModifierDispatcher.dispatch(
        'plus',
        10,
        baseBonuses,
        mockContext
      )
      const minusResult = ModifierDispatcher.dispatch(
        'minus',
        5,
        baseBonuses,
        mockContext
      )

      // Should not modify the original rolls
      expect(plusResult.rolls).toBe(baseBonuses.rolls)
      expect(minusResult.rolls).toBe(baseBonuses.rolls)

      // Should not add logs (maintaining backward compatibility)
      expect(plusResult.logs).toBe(baseBonuses.logs)
      expect(minusResult.logs).toBe(baseBonuses.logs)

      // Should set the correct math modifier
      expect(plusResult.simpleMathModifier).toBe(10)
      expect(minusResult.simpleMathModifier).toBe(-5)
    })

    test('other modifiers use proper modifier classes', () => {
      const dropResult = ModifierDispatcher.dispatch(
        'drop',
        { lowest: 1 },
        baseBonuses,
        mockContext
      )
      const capResult = ModifierDispatcher.dispatch(
        'cap',
        { greaterThan: 3 },
        baseBonuses,
        mockContext
      )

      // These should generate logs as they use the proper modifier classes
      expect(dropResult.logs).toHaveLength(1)
      expect(capResult.logs).toHaveLength(1)

      // Should have proper modifier names in logs
      expect(dropResult.logs[0]?.modifier).toBe('drop')
      expect(capResult.logs[0]?.modifier).toBe('cap')
    })
  })

  describe('extensibility', () => {
    test('demonstrates that the system is extensible', () => {
      // The dispatcher pattern makes it easy to add new modifiers
      // without modifying the core dispatch logic

      // All current modifiers should be handled
      const modifierKeys: (keyof ModifierOptions)[] = [
        'plus',
        'minus',
        'drop',
        'cap',
        'replace',
        'reroll',
        'explode',
        'unique'
      ]

      modifierKeys.forEach((key) => {
        expect(() => {
          // This should not throw for any registered modifier
          ModifierDispatcher.dispatch(key, {}, baseBonuses, mockContext)
        }).not.toThrow(/Unknown modifier/)
      })
    })
  })
})

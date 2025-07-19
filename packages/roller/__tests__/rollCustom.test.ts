import { describe, expect, test } from 'bun:test'
import { rollCustom } from '../src/rollCustom'
import type { RollResult } from '../src/types'

describe('rollCustom', () => {
  describe('basic functionality', () => {
    test('returns one of the provided faces', () => {
      const faces = ['apple', 'banana', 'cherry']
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
    })

    test('baseResult total corresponds to array index + 1', () => {
      const faces = ['first', 'second', 'third', 'fourth']
      const result = rollCustom(faces)

      expect(result.rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(result.rolls[0]?.total).toBeLessThanOrEqual(4)

      const expectedResult = faces[Number(result.rolls[0]?.total) - 1]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(result.result).toBe(expectedResult!)
    })

    test('baseResult has correct dice configuration', () => {
      const faces = ['a', 'b', 'c', 'd', 'e', 'f']
      const result = rollCustom(faces)

      expect(result.rolls[0]?.rolls[0]?.parameters.sides).toBe(6)
      expect(result.rolls[0]?.rolls[0]?.parameters.quantity).toBe(1)
      expect(result.rolls[0]?.rolls[0]?.rolls).toHaveLength(1)
    })
  })

  describe('different face types', () => {
    test('works with string faces', () => {
      const faces = ['north', 'south', 'east', 'west']
      const result = rollCustom(faces)

      expect(typeof result.result).toBe('string')
      expect(faces).toContain(result.result)
    })

    test('works with number faces', () => {
      const faces = [10, 20, 30, 40, 50]
      const result = rollCustom(faces)

      expect(typeof result.result).toBe('number')
      expect(faces).toContain(result.result)
    })

    test('works with object faces', () => {
      const faces = [
        { name: 'fire', damage: 5 },
        { name: 'ice', damage: 3 },
        { name: 'lightning', damage: 7 }
      ]
      const result = rollCustom(faces)

      expect(typeof result.result).toBe('object')
      expect(faces).toContain(result.result)
      expect(result.result).toHaveProperty('name')
      expect(result.result).toHaveProperty('damage')
    })

    test('works with boolean faces', () => {
      const faces = [true, false]
      const result = rollCustom(faces)

      expect(typeof result.result).toBe('boolean')
      expect(faces).toContain(result.result)
    })

    test('works with mixed type faces', () => {
      const faces = ['text', 42, true, { key: 'value' }, null]
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
    })

    test('works with symbol faces', () => {
      const symbol1 = Symbol('option1')
      const symbol2 = Symbol('option2')
      const faces = [symbol1, symbol2]
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
    })
  })

  describe('edge cases', () => {
    test('works with single face', () => {
      const faces = ['only-option']
      const result = rollCustom(faces)

      expect(result.result).toBe('only-option')
      expect(result.rolls[0]?.total).toBe(1)
      expect(result.rolls[0]?.rolls[0]?.parameters.sides).toBe(1)
    })

    test('works with many faces', () => {
      const faces = Array.from({ length: 100 }, (_, i) => `option-${String(i)}`)
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
      expect(result.rolls[0]?.rolls[0]?.parameters.sides).toBe(100)
      expect(result.rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(result.rolls[0]?.total).toBeLessThanOrEqual(100)
    })

    test('works with duplicate faces', () => {
      const faces = ['same', 'same', 'different', 'same']
      const result = rollCustom(faces)

      expect(['same', 'different']).toContain(result.result)
      expect(result.rolls[0]?.rolls[0]?.parameters.sides).toBe(4)
    })

    test('works with empty string faces', () => {
      const faces = ['', 'not-empty', '']
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
    })

    test('works with undefined and null faces', () => {
      const faces = [undefined, null, 'defined']
      const result = rollCustom(faces)

      expect(faces).toContain(result.result)
    })
  })

  describe('error conditions', () => {
    test('throws error for empty array', () => {
      const faces: string[] = []

      expect(() => rollCustom(faces)).toThrow('Failed to properly roll.')
    })
  })

  describe('randomness validation', () => {
    test('produces different results across multiple calls', () => {
      const faces = ['a', 'b', 'c', 'd', 'e', 'f']
      const results = Array.from({ length: 20 }, () => rollCustom(faces).result)

      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBeGreaterThan(1)
    })

    test('produces reasonably distributed results', () => {
      const faces = ['red', 'blue', 'green', 'yellow']
      const results = Array.from(
        { length: 400 },
        () => rollCustom(faces).result
      )

      const counts = {
        red: 0,
        blue: 0,
        green: 0,
        yellow: 0
      }

      results.forEach((result) => {
        counts[result as keyof typeof counts]++
      })

      // Each face should appear roughly 100 times (400/4), allow for reasonable variance
      Object.values(counts).forEach((count) => {
        expect(count).toBeGreaterThan(50) // At least 50 times
        expect(count).toBeLessThan(150) // At most 150 times
      })
    })
  })

  describe('type safety', () => {
    test('maintains type information for number arrays', () => {
      const faces = [1, 2, 3, 4, 5]
      const result: RollResult = rollCustom(faces)

      expect(typeof result.result).toBe('number')
    })

    test('works with complex object types', () => {
      interface GameAction {
        name: string
        cost: number
        effect: string
      }

      const faces: GameAction[] = [
        { name: 'Attack', cost: 1, effect: 'Deal damage' },
        { name: 'Defend', cost: 0, effect: 'Block damage' },
        { name: 'Heal', cost: 2, effect: 'Restore health' }
      ]

      const result: RollResult<GameAction> = rollCustom(faces)

      expect(result.result).toHaveProperty('name')
      expect(result.result).toHaveProperty('cost')
      expect(result.result).toHaveProperty('effect')
      expect(typeof result.result.name).toBe('string')
      expect(typeof result.result.cost).toBe('number')
    })
  })

  describe('integration with base roll system', () => {
    test('baseResult has correct roll history', () => {
      const faces = ['a', 'b', 'c']
      const result = rollCustom(faces)

      expect(result.rolls[0]?.rolls[0]?.modifierHistory).toHaveProperty(
        'modifiedRolls'
      )
      expect(result.rolls[0]?.rolls[0]?.modifierHistory).toHaveProperty('total')
      expect(result.rolls[0]?.rolls[0]?.modifierHistory).toHaveProperty(
        'initialRolls'
      )
      expect(result.rolls[0]?.rolls[0]?.modifierHistory).toHaveProperty('logs')

      expect(
        result.rolls[0]?.rolls[0]?.modifierHistory.modifiedRolls
      ).toHaveLength(1)
      expect(
        result.rolls[0]?.rolls[0]?.modifierHistory.initialRolls
      ).toHaveLength(1)
      expect(result.rolls[0]?.rolls[0]?.modifierHistory.total).toBe(
        Number(result.rolls[0]?.total)
      )
    })
  })
})

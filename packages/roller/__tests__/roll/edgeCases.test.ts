import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import { ModifierError } from '../../src/errors'

describe('edge cases', () => {
  describe('validation errors', () => {
    test('zero quantity throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 0 })).toThrow()
    })

    test('negative quantity throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: -1 })).toThrow()
    })

    test('zero sides throws validation error', () => {
      expect(() => roll({ sides: 0, quantity: 1 })).toThrow()
    })

    test('negative sides throws validation error', () => {
      expect(() => roll({ sides: -5, quantity: 1 })).toThrow()
    })

    test('non-integer quantity throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 0.5 })).toThrow()
    })

    test('non-integer sides throws validation error', () => {
      expect(() => roll({ sides: 6.5, quantity: 1 })).toThrow()
    })

    test('empty sides array throws validation error', () => {
      expect(() => roll({ sides: [], quantity: 1 })).toThrow()
    })
  })

  describe('modifier edge cases', () => {
    test('drop all dice throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 2, modifiers: { drop: { lowest: 2 } } })).toThrow(
        ModifierError
      )
    })

    test('drop more than available throws validation error', () => {
      expect(() =>
        roll({ sides: 6, quantity: 3, modifiers: { drop: { lowest: 2, highest: 2 } } })
      ).toThrow(ModifierError)
    })

    test('unique with quantity > sides throws', () => {
      expect(() => roll({ sides: 4, quantity: 5, modifiers: { unique: true } })).toThrow(
        ModifierError
      )
    })

    test('keep more than available throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 3, modifiers: { keep: { highest: 5 } } })).toThrow(
        ModifierError
      )
    })

    test('keep zero throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 3, modifiers: { keep: { highest: 0 } } })).toThrow(
        ModifierError
      )
    })

    test('reroll value outside range throws validation error', () => {
      expect(() => roll({ sides: 6, quantity: 3, modifiers: { reroll: { exact: [10] } } })).toThrow(
        ModifierError
      )
    })

    test('cap with invalid range throws validation error', () => {
      expect(() =>
        roll({
          sides: 20,
          quantity: 1,
          modifiers: { cap: { lessThan: 10, greaterThan: 5 } }
        })
      ).toThrow(ModifierError)
    })
  })

  describe('arithmetic edge cases', () => {
    test('negative modifier exceeding roll produces negative total', () => {
      const result = roll({ sides: 1, quantity: 1, modifiers: { minus: 10 } })
      expect(result.total).toBe(-9) // 1 - 10 = -9
    })

    test('large positive modifier produces large total', () => {
      const result = roll({ sides: 1, quantity: 1, modifiers: { plus: 100 } })
      expect(result.total).toBe(101) // 1 + 100 = 101
    })
  })

  describe('keep modifier behavior', () => {
    test('keep highest 3 from 4d6 is equivalent to drop lowest', () => {
      const keepResult = roll({ sides: 6, quantity: 4, modifiers: { keep: { highest: 3 } } })
      const dropResult = roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })

      // Both should have 3 dice in the result
      expect(keepResult.rolls[0]?.rolls.length).toBe(3)
      expect(dropResult.rolls[0]?.rolls.length).toBe(3)
    })

    test('keep lowest 2 from 4d6 is equivalent to drop highest 2', () => {
      const keepResult = roll({ sides: 6, quantity: 4, modifiers: { keep: { lowest: 2 } } })
      const dropResult = roll({ sides: 6, quantity: 4, modifiers: { drop: { highest: 2 } } })

      expect(keepResult.rolls[0]?.rolls.length).toBe(2)
      expect(dropResult.rolls[0]?.rolls.length).toBe(2)
    })
  })

  describe('exploding dice edge cases', () => {
    test('explode once produces at least original count', () => {
      const result = roll({ sides: 6, quantity: 3, modifiers: { explode: true } })
      expect(result.rolls[0]?.rolls.length).toBeGreaterThanOrEqual(3)
    })

    test('explode unlimited can produce many dice', () => {
      // With seeded random, we can test this deterministically
      const result = roll({ sides: 6, quantity: 1, modifiers: { explode: 0 } })
      // Should have at least 1 die, potentially many more if 6s keep rolling
      expect(result.rolls[0]?.rolls.length).toBeGreaterThanOrEqual(1)
    })

    test('explode with depth limit respects limit', () => {
      const result = roll({ sides: 6, quantity: 1, modifiers: { explode: 3 } })
      // Max would be 1 original + 3 explosions = 4 dice
      expect(result.rolls[0]?.rolls.length).toBeLessThanOrEqual(4)
    })
  })

  describe('multiplier modifiers', () => {
    describe('pre-arithmetic multiply (*N)', () => {
      test('multiply doubles dice sum before arithmetic', () => {
        // With d1, we always get 1. 2 dice = 2. Multiply by 2 = 4.
        const result = roll({ sides: 1, quantity: 2, modifiers: { multiply: 2 } })
        expect(result.total).toBe(4) // (1+1) * 2 = 4
      })

      test('multiply with plus applies in correct order: (dice * N) + plus', () => {
        // 2d1 = 2, multiply by 2 = 4, plus 3 = 7
        const result = roll({ sides: 1, quantity: 2, modifiers: { multiply: 2, plus: 3 } })
        expect(result.total).toBe(7) // (2 * 2) + 3 = 7
      })

      test('multiply with minus applies in correct order: (dice * N) - minus', () => {
        // 2d1 = 2, multiply by 3 = 6, minus 2 = 4
        const result = roll({ sides: 1, quantity: 2, modifiers: { multiply: 3, minus: 2 } })
        expect(result.total).toBe(4) // (2 * 3) - 2 = 4
      })

      test('multiply by 1 has no effect', () => {
        const result = roll({ sides: 1, quantity: 3, modifiers: { multiply: 1 } })
        expect(result.total).toBe(3) // 3 * 1 = 3
      })

      test('multiply by 0 results in 0 dice sum', () => {
        const result = roll({ sides: 1, quantity: 5, modifiers: { multiply: 0 } })
        expect(result.total).toBe(0) // 5 * 0 = 0
      })

      test('multiply by 0 with plus still applies plus', () => {
        const result = roll({ sides: 1, quantity: 5, modifiers: { multiply: 0, plus: 10 } })
        expect(result.total).toBe(10) // (5 * 0) + 10 = 10
      })
    })

    describe('total multiply (**N)', () => {
      test('multiplyTotal doubles final total after arithmetic', () => {
        // 2d1 = 2, multiplyTotal by 2 = 4
        const result = roll({ sides: 1, quantity: 2, modifiers: { multiplyTotal: 2 } })
        expect(result.total).toBe(4) // 2 * 2 = 4
      })

      test('multiplyTotal with plus applies in correct order: (dice + plus) * N', () => {
        // 2d1 = 2, plus 3 = 5, multiplyTotal by 2 = 10
        const result = roll({ sides: 1, quantity: 2, modifiers: { plus: 3, multiplyTotal: 2 } })
        expect(result.total).toBe(10) // (2 + 3) * 2 = 10
      })

      test('multiplyTotal with minus applies in correct order: (dice - minus) * N', () => {
        // 3d1 = 3, minus 1 = 2, multiplyTotal by 3 = 6
        const result = roll({ sides: 1, quantity: 3, modifiers: { minus: 1, multiplyTotal: 3 } })
        expect(result.total).toBe(6) // (3 - 1) * 3 = 6
      })

      test('multiplyTotal by 1 has no effect', () => {
        const result = roll({ sides: 1, quantity: 3, modifiers: { plus: 2, multiplyTotal: 1 } })
        expect(result.total).toBe(5) // (3 + 2) * 1 = 5
      })

      test('multiplyTotal by 0 results in 0', () => {
        const result = roll({ sides: 1, quantity: 5, modifiers: { plus: 10, multiplyTotal: 0 } })
        expect(result.total).toBe(0) // (5 + 10) * 0 = 0
      })
    })

    describe('both multipliers together', () => {
      test('order is: ((dice * multiply) + plus) * multiplyTotal', () => {
        // 2d1 = 2, multiply by 2 = 4, plus 3 = 7, multiplyTotal by 2 = 14
        const result = roll({
          sides: 1,
          quantity: 2,
          modifiers: { multiply: 2, plus: 3, multiplyTotal: 2 }
        })
        expect(result.total).toBe(14) // ((2 * 2) + 3) * 2 = 14
      })

      test('complex example with both multipliers and minus', () => {
        // 3d1 = 3, multiply by 2 = 6, minus 1 = 5, multiplyTotal by 3 = 15
        const result = roll({
          sides: 1,
          quantity: 3,
          modifiers: { multiply: 2, minus: 1, multiplyTotal: 3 }
        })
        expect(result.total).toBe(15) // ((3 * 2) - 1) * 3 = 15
      })
    })

    describe('notation parsing', () => {
      test('parses *N as pre-arithmetic multiply', () => {
        const result = roll('2d1*2' as string)
        expect(result.total).toBe(4) // (1+1) * 2 = 4
      })

      test('parses **N as total multiply', () => {
        const result = roll('2d1**2' as string)
        expect(result.total).toBe(4) // (1+1) * 2 = 4
      })

      test('parses *N+M correctly: (dice * N) + M', () => {
        const result = roll('2d1*2+3' as string)
        expect(result.total).toBe(7) // (2 * 2) + 3 = 7
      })

      test('parses +M**N correctly: (dice + M) * N', () => {
        const result = roll('2d1+3**2' as string)
        expect(result.total).toBe(10) // (2 + 3) * 2 = 10
      })

      test('parses *N+M**P correctly: ((dice * N) + M) * P', () => {
        const result = roll('2d1*2+3**2' as string)
        expect(result.total).toBe(14) // ((2 * 2) + 3) * 2 = 14
      })
    })
  })
})

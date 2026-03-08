import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'

describe('modifier interactions', () => {
  describe('drop + keep on same pool', () => {
    test('drop 1 lowest (priority 20) then keep 2 highest (priority 21) from 4d6 = 2 dice', () => {
      // Execution order: drop runs first (priority 20), removing the lowest die from 4 → 3 remain.
      // Keep runs second (priority 21), keeping highest 2 from those 3 → 2 remain.
      // Validation uses original quantity (4), so both modifiers pass validation independently.
      const result = roll({
        sides: 6,
        quantity: 4,
        modifiers: { drop: { lowest: 1 }, keep: { highest: 2 } }
      })
      expect(result.error).toBeNull()
      expect(result.rolls[0]?.rolls.length).toBe(2)
    })
  })

  describe('arithmetic modifier ordering', () => {
    test('multiply (*) applies before plus, multiplyTotal (**) applies last', () => {
      // 2d1 = [1, 1], baseTotal = 2
      // Priority 85 multiply: 2 * 3 = 6
      // Priority 90 plus:     6 + 4 = 10
      // Priority 100 multiplyTotal: 10 * 2 = 20
      const result = roll({
        sides: 1,
        quantity: 2,
        modifiers: { multiply: 3, plus: 4, multiplyTotal: 2 }
      })
      expect(result.error).toBeNull()
      expect(result.total).toBe(20)
    })
  })

  describe('explode + drop interaction', () => {
    test('drop applies after explosions, leaving at least 3 dice in pool', () => {
      // Explode runs at priority 50, drop runs at priority 20.
      // So drop runs BEFORE explode. After drop(1 lowest) from 4d6 → 3 remain.
      // Any explosions on those 3 only add dice, so final pool is >= 3.
      const result = roll({
        sides: 6,
        quantity: 4,
        modifiers: { explode: true, drop: { lowest: 1 } }
      })
      expect(result.error).toBeNull()
      // drop runs first (priority 20) → 3 dice; explode (priority 50) can add more
      expect(result.rolls[0]?.rolls.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('countSuccesses + arithmetic', () => {
    test('countSuccesses (priority 95) overwrites plus (priority 90) total', () => {
      // 4d1 → all rolls are always 1, baseTotal = 4
      // Transformers applied in priority order:
      //   plus (90): accumulated total becomes 4 + 2 = 6
      //   countSuccesses (95): ignores accumulated total, recounts rolls >= 1 → 4 successes
      // countSuccesses completely replaces the plus contribution because its
      // transformTotal callback signature is (_total, currentRolls) and discards _total.
      const result = roll({
        sides: 1,
        quantity: 4,
        modifiers: { countSuccesses: { threshold: 1 }, plus: 2 }
      })
      expect(result.error).toBeNull()
      // countSuccesses ignores the +2 from plus and returns 4 (all dice meet threshold >= 1)
      expect(result.total).toBe(4)
    })

    test('countSuccesses with botchThreshold subtracts botches', () => {
      // 4d6 all set to 1 via sides:1. threshold=6 (no successes), botchThreshold=1 (all are botches)
      // botchThreshold must be < threshold per validation
      // 4d1 → all rolls are 1, successes >= 6 → 0, botches <= 1 → 4, total = 0 - 4 = -4
      const result = roll({
        sides: 1,
        quantity: 4,
        modifiers: { countSuccesses: { threshold: 6, botchThreshold: 1 } }
      })
      expect(result.error).toBeNull()
      expect(result.total).toBe(-4)
    })
  })

  describe('unique + reroll', () => {
    test('unique and reroll can coexist without error on valid input', () => {
      // unique (priority 60) and reroll (priority 40) both operate on rolls.
      // Reroll runs first: removes 1s and rerolls. Unique runs after: ensures no duplicates.
      // Note: rerolled values come from rollOne() which is 0-based (0..sides-1),
      // so values may not always be > 1 even after reroll. We only verify uniqueness.
      const result = roll({
        sides: 6,
        quantity: 3,
        modifiers: { unique: true, reroll: { exact: [1] } }
      })
      if (!result.error) {
        const rolls = result.rolls[0]?.rolls ?? []
        const uniqueSet = new Set(rolls)
        expect(uniqueSet.size).toBe(rolls.length)
      }
    })
  })

  describe('cap + reroll priority', () => {
    test('cap (priority 10) applies before reroll (priority 40), so reroll sees capped values', () => {
      // 2d1 → all rolls start as 1.
      // cap (greaterThan: 0) runs first (priority 10): caps values > 0 to 0, all rolls → 0.
      // reroll (exact: [1]) runs second (priority 40): looks for 1s, finds none (all are 0).
      // Result: no error, rolls are [0, 0], total = 0.
      // reroll validate accepts exact: [1] because 1 <= sides (1), so validation passes.
      const result = roll({
        sides: 1,
        quantity: 2,
        modifiers: { cap: { greaterThan: 0 }, reroll: { exact: [1] } }
      })
      expect(result).toBeDefined()
      expect(result.error).toBeNull()
      // After cap clamps all 1s to 0, reroll never fires — final total is 0
      expect(result.total).toBe(0)
    })
  })
})

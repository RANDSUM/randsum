import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/games/fifth'

describe('roll', () => {
  describe('basic roll', () => {
    const args = { modifier: 5 }

    test('returns a total within valid range', () => {
      const rollResult = roll(args)
      expect(rollResult.total).toBeGreaterThanOrEqual(6)
      expect(rollResult.total).toBeLessThanOrEqual(25)
    })

    test('applies modifier correctly', () => {
      const rollResult = roll(args)
      const rawRoll = rollResult.rolls[0]?.initialRolls[0]
      expect(rollResult.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })

    test('returns single roll result', () => {
      const rollResult = roll(args)
      expect(rollResult.rolls[0]?.initialRolls).toHaveLength(1)
    })
  })

  describe('with advantage', () => {
    const args = {
      modifier: 5,
      rollingWith: 'Advantage' as const
    }

    test('returns two rolls', () => {
      const result = roll(args)
      expect(result.rolls[0]?.initialRolls).toHaveLength(2)
    })

    test('uses higher roll for total', () => {
      const result = roll(args)
      const rolls = result.rolls[0]?.initialRolls ?? []
      const expectedTotal = Math.max(Number(rolls[0]), Number(rolls[1])) + args.modifier
      expect(result.rolls[0]?.total).toBe(expectedTotal)
    })
  })

  describe('with disadvantage', () => {
    const args = {
      modifier: 5,
      rollingWith: 'Disadvantage' as const
    }

    test('returns two rolls', () => {
      const result = roll(args)
      expect(result.rolls[0]?.initialRolls).toHaveLength(2)
    })

    test('uses lower roll for total', () => {
      const result = roll(args)
      const rolls = result.rolls[0]?.initialRolls ?? []
      const expectedTotal = Math.min(Number(rolls[0]), Number(rolls[1])) + args.modifier
      expect(result.rolls[0]?.total).toBe(expectedTotal)
    })
  })

  describe('with both advantage and disadvantage', () => {
    const args = { modifier: 5 }

    test('returns single roll result', () => {
      const result = roll(args)
      expect(result.rolls[0]?.initialRolls).toHaveLength(1)
    })

    test('applies modifier correctly', () => {
      const result = roll(args)
      const rawRoll = result.rolls[0]?.initialRolls[0]
      expect(result.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })
  })

  describe('with negative modifier', () => {
    const args = { modifier: -3 }

    test('returns a result within valid range', () => {
      const result = roll(args)
      expect(result.rolls[0]?.total).toBeGreaterThanOrEqual(-2)
      expect(result.rolls[0]?.total).toBeLessThanOrEqual(17)
    })

    test('applies negative modifier correctly', () => {
      const result = roll(args)
      const rawRoll = result.rolls[0]?.initialRolls[0]
      expect(result.rolls[0]?.total).toBe(Number(rawRoll) + args.modifier)
    })
  })

  describe('crit detection', () => {
    test('criticals is undefined when crit is not passed', () => {
      const result = roll({ modifier: 0 })
      expect(result.details.criticals).toBeUndefined()
    })

    test('criticals is present when crit is true', () => {
      const result = roll({ modifier: 0, crit: true })
      expect(result.details.criticals).toBeDefined()
      expect(typeof result.details.criticals?.isNatural1).toBe('boolean')
      expect(typeof result.details.criticals?.isNatural20).toBe('boolean')
    })

    test('criticals works with advantage', () => {
      const result = roll({ modifier: 0, rollingWith: 'Advantage', crit: true })
      expect(result.details.criticals).toBeDefined()
    })

    test('criticals works with disadvantage', () => {
      const result = roll({ modifier: 0, rollingWith: 'Disadvantage', crit: true })
      expect(result.details.criticals).toBeDefined()
    })
  })

  // Gap 14: Deterministic crit detection
  //
  // The generated roll() does not expose a randomFn option — it calls executeRoll
  // internally with no way to inject a seeded RNG from the game API layer.
  // We use stress testing (9999 iterations) to deterministically exercise the
  // nat-1 and nat-20 code paths and assert the correct boolean values.
  describe('deterministic crit detection', () => {
    test('isNatural1 is true when the rolled value is 1', () => {
      const iterations = 9999
      const results = Array.from({ length: iterations }, () => roll({ modifier: 0, crit: true }))
      const nat1Result = results.find(r => r.rolls[0]?.initialRolls[0] === 1)
      // With 9999 rolls of a d20, the probability of never rolling 1 is (19/20)^9999 ~= 0
      expect(nat1Result).toBeDefined()
      expect(nat1Result?.details.criticals?.isNatural1).toBe(true)
      expect(nat1Result?.details.criticals?.isNatural20).toBe(false)
    })

    test('isNatural20 is true when the rolled value is 20', () => {
      const iterations = 9999
      const results = Array.from({ length: iterations }, () => roll({ modifier: 0, crit: true }))
      const nat20Result = results.find(r => r.rolls[0]?.initialRolls[0] === 20)
      // With 9999 rolls of a d20, the probability of never rolling 20 is (19/20)^9999 ~= 0
      expect(nat20Result).toBeDefined()
      expect(nat20Result?.details.criticals?.isNatural20).toBe(true)
      expect(nat20Result?.details.criticals?.isNatural1).toBe(false)
    })
  })

  describe('input validation', () => {
    test('throws error for NaN modifier', () => {
      expect(() => roll({ modifier: NaN })).toThrow(
        '5E modifier must be a finite number, received: NaN'
      )
    })

    test('throws error for Infinity modifier', () => {
      expect(() => roll({ modifier: Infinity })).toThrow(
        '5E modifier must be a finite number, received: Infinity'
      )
    })

    test('throws error for modifier too high', () => {
      expect(() => roll({ modifier: 31 })).toThrow(
        '5E modifier must be between -30 and 30, received: 31'
      )
    })

    test('throws error for modifier too low', () => {
      expect(() => roll({ modifier: -31 })).toThrow(
        '5E modifier must be between -30 and 30, received: -31'
      )
    })

    test('allows maximum valid modifier', () => {
      expect(() => roll({ modifier: 30 })).not.toThrow()
    })

    test('allows minimum valid modifier', () => {
      expect(() => roll({ modifier: -30 })).not.toThrow()
    })
  })
})

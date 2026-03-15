import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import type { RandomFn } from '../../src/lib/random'

// RNG that always returns max value: coreRandom(sides, ()=>0.99) = sides
const alwaysMax: RandomFn = () => 0.99

// RNG that never triggers max: always returns ~half
const neverMax: RandomFn = () => 0.49

/**
 * Create a controlled RNG that returns values from a predefined sequence.
 * Falls back to a default value when the sequence is exhausted.
 */
function createControlledRng(values: readonly number[], fallback = 0.3): RandomFn {
  const state = { index: 0 }
  return (): number => {
    const val = values[state.index] ?? fallback
    state.index++
    return val
  }
}

describe('explodeSequence modifier', () => {
  describe('basic behavior via options', () => {
    test('adds a die from the next size when max is rolled', () => {
      // Roll 1d4 with sequence [4, 6, 8].
      // alwaysMax: d4 rolls 4 (max) -> explode to d4, rolls 4 (max) -> d6...
      // With depth cap, should terminate
      const result = roll(
        { sides: 4, quantity: 1, modifiers: { explodeSequence: [4, 6, 8] } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
      // Total should be > 4 since explosions happened
      expect(result.total).toBeGreaterThan(4)
    })

    test('does not explode when max is not rolled', () => {
      const result = roll(
        { sides: 4, quantity: 1, modifiers: { explodeSequence: [4, 6, 8] } },
        { randomFn: neverMax }
      )
      // Should just be 1d4 result, no explosions
      expect(result.rolls[0]?.rolls.length).toBe(1)
    })

    test('progresses through the sequence on consecutive max rolls', () => {
      // RNG calls: initial d4, then explosion d6, d8, d10
      // [0.99, 0.99, 0.99, 0.3] -> d4=4(max), d6=6(max), d8=8(max), d10=4(stop)
      const controlledRng = createControlledRng([0.99, 0.99, 0.99, 0.3])

      const result = roll(
        { sides: 4, quantity: 1, modifiers: { explodeSequence: [6, 8, 10] } },
        { randomFn: controlledRng }
      )
      // Should have 4 dice in the pool (original + 3 explosions)
      expect(result.rolls[0]?.rolls.length).toBe(4)
    })

    test('last die in sequence repeats on max', () => {
      // Sequence is [6]. After d4 explodes to d6, if d6 maxes, keep rolling d6
      // [0.99, 0.99, 0.99, 0.3] -> d4=4(max), d6=6(max), d6=6(max repeat), d6=~2(stop)
      const controlledRng = createControlledRng([0.99, 0.99, 0.99, 0.3])

      const result = roll(
        { sides: 4, quantity: 1, modifiers: { explodeSequence: [6] } },
        { randomFn: controlledRng }
      )
      // Roll 1: d4=4(max), Roll 2: d6=6(max, repeat), Roll 3: d6=6(max, repeat), Roll 4: d6=~2(stop)
      expect(result.rolls[0]?.rolls.length).toBe(4)
    })
  })

  describe('safety cap', () => {
    test('does not infinite loop with alwaysMax RNG', () => {
      const result = roll(
        { sides: 4, quantity: 1, modifiers: { explodeSequence: [4] } },
        { randomFn: alwaysMax }
      )
      expect(result).toBeDefined()
      expect(Number.isFinite(result.total)).toBe(true)
    })
  })

  describe('notation string parsing', () => {
    test('roll("1d4!s{6,8,10}") works', () => {
      const result = roll('1d4!s{6,8,10}', { randomFn: neverMax })
      expect(result).toBeDefined()
      expect(result.rolls[0]?.rolls.length).toBe(1)
    })

    test('roll("1d4!S{6,8,10}") case-insensitive', () => {
      const result = roll('1d4!S{6,8,10}', { randomFn: neverMax })
      expect(result).toBeDefined()
      expect(result.rolls[0]?.rolls.length).toBe(1)
    })
  })

  describe('sugar: inflation (!i)', () => {
    test('roll("2d6!i") produces a valid result', () => {
      const result = roll('2d6!i', { randomFn: neverMax })
      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
    })

    test('roll("1d4!i") with alwaysMax triggers the full chain', () => {
      const result = roll('1d4!i', { randomFn: alwaysMax })
      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThan(4)
    })
  })

  describe('sugar: reductive (!r)', () => {
    test('roll("1d20!r") produces a valid result', () => {
      const result = roll('1d20!r', { randomFn: neverMax })
      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThan(0)
    })

    test('roll("1d20!r") with alwaysMax triggers the chain going down', () => {
      const result = roll('1d20!r', { randomFn: alwaysMax })
      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThan(20)
    })
  })

  describe('integration with other modifiers', () => {
    test('roll("1d4!s{6,8,10}+2") applies arithmetic after explosion', () => {
      const result = roll('1d4!s{6,8,10}+2', { randomFn: neverMax })
      expect(result).toBeDefined()
      // With neverMax, only 1 die roll + 2
      expect(result.total).toBeGreaterThanOrEqual(3) // min d4 (1) + 2
    })
  })

  describe('property: result is always >= initial roll', () => {
    test('explode sequence only adds to the pool', () => {
      const iterations = 100
      for (const _ of Array.from({ length: iterations })) {
        const result = roll({
          sides: 6,
          quantity: 1,
          modifiers: { explodeSequence: [8, 10, 12] }
        })
        // Total must be at least 1 (minimum d6 roll)
        expect(result.total).toBeGreaterThanOrEqual(1)
        // Rolls should never be fewer than the original quantity
        expect(result.rolls[0]?.rolls.length).toBeGreaterThanOrEqual(1)
      }
    })
  })
})

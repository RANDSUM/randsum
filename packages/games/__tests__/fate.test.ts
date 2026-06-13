import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/games/fate'
import { STRESS_ITERATIONS } from './stressIterations'

const LADDER = [
  'Legendary',
  'Epic',
  'Fantastic',
  'Superb',
  'Great',
  'Good',
  'Fair',
  'Average',
  'Mediocre',
  'Poor',
  'Terrible'
] as const

describe('roll', () => {
  describe('basic roll (no modifier)', () => {
    test('rolls four Fate dice', () => {
      const result = roll()
      expect(result.rolls[0]?.initialRolls).toHaveLength(4)
    })

    test('total is within 4dF bounds (-4 to +4)', () => {
      const result = roll()
      expect(result.total).toBeGreaterThanOrEqual(-4)
      expect(result.total).toBeLessThanOrEqual(4)
    })

    test('each Fate die is -1, 0, or +1', () => {
      const result = roll()
      for (const die of result.rolls[0]?.initialRolls ?? []) {
        expect([-1, 0, 1]).toContain(die)
      }
    })

    test('result is a valid ladder rung', () => {
      const result = roll()
      expect(LADDER).toContain(result.result)
    })
  })

  describe('with a positive modifier', () => {
    const args = { modifier: 4 }

    test('applies the modifier to the total', () => {
      const result = roll(args)
      const diceTotal = (result.rolls[0]?.initialRolls ?? []).reduce((s, v) => s + v, 0)
      expect(result.total).toBe(diceTotal + args.modifier)
    })

    test('total range shifts by the modifier (0 to +8)', () => {
      const result = roll(args)
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(8)
    })
  })

  describe('with a negative modifier', () => {
    const args = { modifier: -2 }

    test('applies the modifier to the total', () => {
      const result = roll(args)
      const diceTotal = (result.rolls[0]?.initialRolls ?? []).reduce((s, v) => s + v, 0)
      expect(result.total).toBe(diceTotal + args.modifier)
    })
  })

  describe('naked scalar overload', () => {
    test('accepts a plain number as the modifier', () => {
      const result = roll(2)
      const diceTotal = (result.rolls[0]?.initialRolls ?? []).reduce((s, v) => s + v, 0)
      expect(result.total).toBe(diceTotal + 2)
      expect(LADDER).toContain(result.result)
    })
  })

  describe('ladder rung classification', () => {
    test.each([
      [8, 'Legendary'],
      [7, 'Epic'],
      [6, 'Fantastic'],
      [5, 'Superb'],
      [4, 'Great'],
      [3, 'Good'],
      [2, 'Fair'],
      [1, 'Average'],
      [0, 'Mediocre'],
      [-1, 'Poor'],
      [-2, 'Terrible']
    ] as const)('a total of %d maps to %s', (total, expected) => {
      // Hold the modifier near the target total and sample rolls until the exact total appears,
      // then assert the rung. Terrible/Legendary clamp the open-ended ends of the ladder.
      const modifier = Math.max(-2, Math.min(4, total))
      const matched = Array.from({ length: STRESS_ITERATIONS })
        .map(() => roll({ modifier }))
        .filter(result => result.total === total)
      expect(matched.length).toBeGreaterThan(0)
      for (const result of matched) {
        expect(result.result).toBe(expected)
      }
    })
  })

  describe('stress', () => {
    test('every roll classifies to a known ladder rung', () => {
      Array.from({ length: STRESS_ITERATIONS }).forEach((_unused, i) => {
        const modifier = (i % 7) - 2
        const result = roll({ modifier })
        expect(LADDER).toContain(result.result)
      })
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/games/root-rpg'
import { STRESS_ITERATIONS } from './stressIterations'

describe('roll', () => {
  describe('roll ranges', () => {
    test('returns result within valid range (2d6 + modifier)', () => {
      const bonus = 2
      const rollResult = roll({ bonus })
      expect(rollResult.total).toBeGreaterThanOrEqual(2 + bonus)
      expect(rollResult.total).toBeLessThanOrEqual(12 + bonus)
    })

    test('returns two dice results', () => {
      const rollResult = roll({ bonus: 0 })
      expect(rollResult.rolls[0]?.initialRolls).toHaveLength(2)
    })
  })

  describe('modifiers', () => {
    test('correctly applies positive modifier', () => {
      const bonus = 3
      const { rolls } = roll({ bonus })
      const rawTotal = rolls[0]?.initialRolls.reduce((sum, roll) => sum + roll, 0)
      expect(rolls[0]?.total).toBe(Number(rawTotal) + bonus)
    })

    test('correctly applies negative modifier', () => {
      const bonus = -2
      const { rolls } = roll({ bonus })
      const rawTotal = rolls[0]?.initialRolls.reduce((sum, roll) => sum + roll, 0)
      expect(rolls[0]?.total).toBe(Number(rawTotal) + bonus)
    })

    test('handles zero modifier', () => {
      const { rolls } = roll({ bonus: 0 })
      const rawTotal = rolls[0]?.initialRolls.reduce((sum, roll) => sum + roll, 0)
      expect(rolls[0]?.total).toBe(Number(rawTotal))
    })
  })

  describe('result interpretation', () => {
    test('returns Proper results', () => {
      const dummyArray = Array.from({ length: STRESS_ITERATIONS }, () => roll({ bonus: 0 }))

      dummyArray.forEach(({ result, total }) => {
        if (result === 'Strong Hit') {
          expect(total).toBeGreaterThanOrEqual(10)
          return
        }

        if (result === 'Weak Hit') {
          expect(total).toBeGreaterThanOrEqual(7)
          expect(total).toBeLessThanOrEqual(9)
          return
        }

        expect(total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('mastery / helping (rollingWith: Advantage)', () => {
    test('rolls 3 dice and keeps highest 2', () => {
      const rollResult = roll({ bonus: 0, rollingWith: 'Advantage' })
      expect(rollResult.rolls[0]?.initialRolls).toHaveLength(3)
      expect(rollResult.rolls[0]?.rolls).toHaveLength(2)
    })

    test('total is sum of kept dice plus bonus', () => {
      const bonus = 2
      const { rolls, total } = roll({ bonus, rollingWith: 'Advantage' })
      const keptSum = rolls[0]?.rolls.reduce((a, b) => a + b, 0) ?? 0
      expect(total).toBe(keptSum + bonus)
    })

    test('keeps the two highest of three dice', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => {
        const { rolls } = roll({ bonus: 0, rollingWith: 'Advantage' })
        const initial = [...(rolls[0]?.initialRolls ?? [])].sort((a, b) => a - b)
        const kept = [...(rolls[0]?.rolls ?? [])].sort((a, b) => a - b)
        const expectedKept = initial.slice(-2)
        expect(kept).toEqual(expectedKept)
      })
    })

    test('total bounded by [2 + bonus, 12 + bonus] (kept dice sum)', () => {
      const bonus = 1
      Array.from({ length: STRESS_ITERATIONS }, () => {
        const { total } = roll({ bonus, rollingWith: 'Advantage' })
        expect(total).toBeGreaterThanOrEqual(2 + bonus)
        expect(total).toBeLessThanOrEqual(12 + bonus)
      })
    })
  })

  describe('helping against (rollingWith: Disadvantage)', () => {
    test('rolls 3 dice and keeps lowest 2', () => {
      const rollResult = roll({ bonus: 0, rollingWith: 'Disadvantage' })
      expect(rollResult.rolls[0]?.initialRolls).toHaveLength(3)
      expect(rollResult.rolls[0]?.rolls).toHaveLength(2)
    })

    test('keeps the two lowest of three dice', () => {
      Array.from({ length: STRESS_ITERATIONS }, () => {
        const { rolls } = roll({ bonus: 0, rollingWith: 'Disadvantage' })
        const initial = [...(rolls[0]?.initialRolls ?? [])].sort((a, b) => a - b)
        const kept = [...(rolls[0]?.rolls ?? [])].sort((a, b) => a - b)
        const expectedKept = initial.slice(0, 2)
        expect(kept).toEqual(expectedKept)
      })
    })

    test('total bounded by [2 + bonus, 12 + bonus] (kept dice sum)', () => {
      const bonus = -1
      Array.from({ length: STRESS_ITERATIONS }, () => {
        const { total } = roll({ bonus, rollingWith: 'Disadvantage' })
        expect(total).toBeGreaterThanOrEqual(2 + bonus)
        expect(total).toBeLessThanOrEqual(12 + bonus)
      })
    })
  })

  describe('rollingWith validation', () => {
    test('omitting rollingWith uses base 2d6 behavior', () => {
      const { rolls } = roll({ bonus: 0 })
      expect(rolls[0]?.initialRolls).toHaveLength(2)
      expect(rolls[0]?.rolls).toHaveLength(2)
    })

    test('throws on invalid rollingWith string', () => {
      expect(() =>
        roll({ bonus: 0, rollingWith: 'Sideways' as 'Advantage' | 'Disadvantage' })
      ).toThrow(/Invalid rollingWith value/)
    })
  })

  describe('edge cases', () => {
    test('throws error for extremely large positive modifiers', () => {
      expect(() => roll({ bonus: 1000 })).toThrow(
        'Root RPG bonus must be between -3 and 5, received: 1000'
      )
    })

    test('throws error for extremely large negative modifiers', () => {
      expect(() => roll({ bonus: -1000 })).toThrow(
        'Root RPG bonus must be between -3 and 5, received: -1000'
      )
    })

    test('handles maximum valid positive modifier', () => {
      const { result, total } = roll({ bonus: 5 })
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(total).toBeGreaterThanOrEqual(7) // 2d6 minimum (2) + 5
      expect(total).toBeLessThanOrEqual(17) // 2d6 maximum (12) + 5
    })

    test('handles maximum valid negative modifier', () => {
      const { result, total } = roll({ bonus: -3 })
      expect(['Strong Hit', 'Weak Hit', 'Miss']).toContain(result)
      expect(total).toBeGreaterThanOrEqual(-1) // 2d6 minimum (2) - 3
      expect(total).toBeLessThanOrEqual(9) // 2d6 maximum (12) - 3
    })

    test('throws error for NaN modifier', () => {
      expect(() => roll({ bonus: NaN })).toThrow(
        'Root RPG bonus must be a finite number, received: NaN'
      )
    })

    test('throws error for Infinity modifier', () => {
      expect(() => roll({ bonus: Infinity })).toThrow(
        'Root RPG bonus must be a finite number, received: Infinity'
      )
    })

    test('throws error for negative Infinity modifier', () => {
      expect(() => roll({ bonus: -Infinity })).toThrow(
        'Root RPG bonus must be a finite number, received: -Infinity'
      )
    })

    test('handles boundary values correctly', () => {
      expect(() => roll({ bonus: 6 })).toThrow('Root RPG bonus must be between -3 and 5')
      expect(() => roll({ bonus: -4 })).toThrow('Root RPG bonus must be between -3 and 5')

      expect(() => roll({ bonus: 5 })).not.toThrow()
      expect(() => roll({ bonus: -3 })).not.toThrow()
    })
  })
})

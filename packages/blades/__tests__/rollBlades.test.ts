import { describe, expect, test } from 'bun:test'
import { rollBlades } from '../src/rollBlades'

describe('rollBlades', () => {
  describe('dice pool sizes', () => {
    test('handles single die (desperate position)', () => {
      const { result, rolls } = rollBlades(1)
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(1)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(1)
      expect(rolls[0]?.total).toBeLessThanOrEqual(6)
    })

    test('handles two dice (risky position)', () => {
      const { result, rolls } = rollBlades(2)
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(2)
      expect(rolls[0]?.total).toBeLessThanOrEqual(12)
    })

    test('handles three dice (controlled position)', () => {
      const { result, rolls } = rollBlades(3)
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(3)
      expect(rolls[0]?.total).toBeGreaterThanOrEqual(3)
      expect(rolls[0]?.total).toBeLessThanOrEqual(18)
    })
  })

  describe('result interpretation', () => {
    const loops = 100

    test('returns consistent baseResult across multiple rolls', () => {
      const result = Array.from({ length: loops }, () => rollBlades(2))

      result.forEach(({ result, rolls }) => {
        expect(['critical', 'success', 'partial', 'failure']).toContain(result)
        expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(2)
        expect(rolls[0]?.total).toBeGreaterThanOrEqual(2)
        expect(rolls[0]?.total).toBeLessThanOrEqual(12)
      })
    })
  })

  describe('input validation', () => {
    test('throws error for non-integer dice pool', () => {
      expect(() => rollBlades(2.5)).toThrow('Blades dice pool must be an integer, received: 2.5')
    })

    test('throws error for negative dice pool', () => {
      expect(() => rollBlades(-1)).toThrow('Blades dice pool must be non-negative, received: -1')
    })

    test('throws error for excessively large dice pool', () => {
      expect(() => rollBlades(15)).toThrow(
        'Blades dice pool is unusually large (15). Maximum recommended is 10.'
      )
    })

    test('handles zero dice pool', () => {
      const { result, rolls } = rollBlades(0)
      expect(['success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(2) // Uses 2d6 drop highest for 0 dice
    })

    test('handles maximum recommended dice pool', () => {
      const { result, rolls } = rollBlades(10)
      expect(['critical', 'success', 'partial', 'failure']).toContain(result)
      expect(rolls[0]?.modifierHistory.initialRolls).toHaveLength(10)
    })

    test('handles boundary values correctly', () => {
      expect(() => rollBlades(11)).toThrow('Maximum recommended is 10')

      expect(() => rollBlades(10)).not.toThrow()
      expect(() => rollBlades(0)).not.toThrow()
    })
  })
})

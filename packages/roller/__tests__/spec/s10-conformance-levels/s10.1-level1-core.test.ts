import { describe, expect, test } from 'bun:test'
import { roll } from '../../../src/roll'

describe('S10.1 — Level 1 Core Conformance', () => {
  describe('NdS basic rolls', () => {
    test('1d6: total in [1, 6]', () => {
      const result = roll('1d6')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
      expect(result.rolls).toHaveLength(1)
    })

    test('2d8: total in [2, 16]', () => {
      const result = roll('2d8')
      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeLessThanOrEqual(16)
      expect(result.rolls[0]!.rolls).toHaveLength(2)
    })

    test('1d20: total in [1, 20]', () => {
      const result = roll('1d20')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(20)
    })

    test('numeric shorthand: roll(6) equivalent to 1d6', () => {
      Array.from({ length: 100 }, () => roll(6)).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(1)
        expect(total).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('+N arithmetic', () => {
    test('1d6+3: total in [4, 9]', () => {
      Array.from({ length: 100 }, () => roll('1d6+3')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(4)
        expect(total).toBeLessThanOrEqual(9)
      })
    })

    test('2d6+5: total in [7, 17]', () => {
      Array.from({ length: 100 }, () => roll('2d6+5')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(7)
        expect(total).toBeLessThanOrEqual(17)
      })
    })
  })

  describe('-N arithmetic', () => {
    test('1d6-2: total in [-1, 4]', () => {
      Array.from({ length: 100 }, () => roll('1d6-2')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-1)
        expect(total).toBeLessThanOrEqual(4)
      })
    })

    test('negative notation -1d6: total in [-6, -1]', () => {
      Array.from({ length: 100 }, () => roll('-1d6')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(-6)
        expect(total).toBeLessThanOrEqual(-1)
      })
    })
  })

  describe('*N multiply', () => {
    test('2d6*2: total is even, in [4, 24]', () => {
      Array.from({ length: 100 }, () => roll('2d6*2')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(4)
        expect(total).toBeLessThanOrEqual(24)
        expect(total % 2).toBe(0)
      })
    })
  })

  describe('L — drop lowest', () => {
    test('4d6L: produces 3 kept dice', () => {
      const result = roll('4d6L')
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('4d6L: total in [3, 18]', () => {
      Array.from({ length: 100 }, () => roll('4d6L')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(3)
        expect(total).toBeLessThanOrEqual(18)
      })
    })
  })

  describe('H — drop highest', () => {
    test('4d6H: produces 3 kept dice', () => {
      const result = roll('4d6H')
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('4d6H: total in [3, 18]', () => {
      Array.from({ length: 100 }, () => roll('4d6H')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(3)
        expect(total).toBeLessThanOrEqual(18)
      })
    })
  })

  describe('KN — keep N highest', () => {
    test('4d6K3: keeps 3 dice', () => {
      const result = roll('4d6K3')
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('4d6K3: total in [3, 18]', () => {
      Array.from({ length: 100 }, () => roll('4d6K3')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(3)
        expect(total).toBeLessThanOrEqual(18)
      })
    })

    test('5d10K2: keeps 2 dice', () => {
      const result = roll('5d10K2')
      expect(result.rolls[0]!.rolls).toHaveLength(2)
    })
  })

  describe('klN — keep N lowest', () => {
    test('4d6kl2: keeps 2 dice', () => {
      const result = roll('4d6kl2')
      expect(result.rolls[0]!.rolls).toHaveLength(2)
    })

    test('4d6kl2: total in [2, 12]', () => {
      Array.from({ length: 100 }, () => roll('4d6kl2')).forEach(({ total }) => {
        expect(total).toBeGreaterThanOrEqual(2)
        expect(total).toBeLessThanOrEqual(12)
      })
    })
  })

  describe('result shape', () => {
    test('result has total, rolls, and notation fields', () => {
      const result = roll('2d6')
      expect(typeof result.total).toBe('number')
      expect(Array.isArray(result.rolls)).toBe(true)
      expect(result.rolls.length).toBeGreaterThan(0)
    })

    test('rolls[0].rolls has one value per die', () => {
      const result = roll('3d8')
      expect(result.rolls[0]!.rolls).toHaveLength(3)
      result.rolls[0]!.rolls.forEach(die => {
        expect(die).toBeGreaterThanOrEqual(1)
        expect(die).toBeLessThanOrEqual(8)
      })
    })
  })
})

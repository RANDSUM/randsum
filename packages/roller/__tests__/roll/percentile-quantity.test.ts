import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { tokenize } from '../../src/notation/tokenize'
import { roll } from '../../src'

describe('Percentile dice with quantity prefix (Nd%)', () => {
  describe('isDiceNotation', () => {
    test('isDiceNotation("d%") returns true (no regression)', () => {
      expect(isDiceNotation('d%')).toBe(true)
    })

    test('isDiceNotation("D%") returns true (no regression)', () => {
      expect(isDiceNotation('D%')).toBe(true)
    })

    test('isDiceNotation("1d%") returns true', () => {
      expect(isDiceNotation('1d%')).toBe(true)
    })

    test('isDiceNotation("3d%") returns true', () => {
      expect(isDiceNotation('3d%')).toBe(true)
    })

    test('isDiceNotation("10d%") returns true', () => {
      expect(isDiceNotation('10d%')).toBe(true)
    })

    test('isDiceNotation("1D%") returns true (case-insensitive)', () => {
      expect(isDiceNotation('1D%')).toBe(true)
    })
  })

  describe('tokenize', () => {
    test('tokenize("d%") returns d% token (no regression)', () => {
      const tokens = tokenize('d%')
      expect(tokens).toHaveLength(1)
      expect(tokens[0]!.key).toBe('d%')
    })

    test('tokenize("1d%") returns a token with key d%', () => {
      const tokens = tokenize('1d%')
      expect(tokens).toHaveLength(1)
      expect(tokens[0]!.key).toBe('d%')
      expect(tokens[0]!.text).toBe('1d%')
    })

    test('tokenize("3d%") returns a token with key d%', () => {
      const tokens = tokenize('3d%')
      expect(tokens).toHaveLength(1)
      expect(tokens[0]!.key).toBe('d%')
      expect(tokens[0]!.text).toBe('3d%')
    })
  })

  describe('roll', () => {
    test('roll("1d%") produces total in [1, 100]', () => {
      const result = roll('1d%')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(100)
    })

    test('roll("1d%") produces 1 die', () => {
      const result = roll('1d%')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.rolls).toHaveLength(1)
    })

    test('roll("1d%") has sides 100', () => {
      const result = roll('1d%')
      expect(result.rolls[0]!.parameters.sides).toBe(100)
    })

    test('roll("3d%") produces total in [3, 300]', () => {
      const result = roll('3d%')
      expect(result.total).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeLessThanOrEqual(300)
    })

    test('roll("3d%") produces 3 dice', () => {
      const result = roll('3d%')
      expect(result.rolls).toHaveLength(1)
      expect(result.rolls[0]!.rolls).toHaveLength(3)
    })

    test('roll("3d%") has sides 100 and quantity 3', () => {
      const result = roll('3d%')
      const record = result.rolls[0]!
      expect(record.parameters.sides).toBe(100)
      expect(record.initialRolls).toHaveLength(3)
    })

    test('roll("d%") still works (no regression)', () => {
      const result = roll('d%')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(100)
    })

    test('stress test: roll("3d%") total always in [3, 300]', () => {
      Array.from({ length: 9999 }).forEach(() => {
        const result = roll('3d%')
        expect(result.total).toBeGreaterThanOrEqual(3)
        expect(result.total).toBeLessThanOrEqual(300)
      })
    })
  })
})

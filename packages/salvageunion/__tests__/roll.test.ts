import { describe, expect, test } from 'bun:test'
import { roll } from '../src/roll'
import type { Hit } from '../src/types'

describe(roll, () => {
  describe('return type', () => {
    test('returns a tuple of [TableResult, number]', () => {
      const [result, rollValue] = roll()

      expect(typeof result).toBe('object')
      expect(typeof rollValue).toBe('number')
      expect(result).toHaveProperty('hit')
      expect(result).toHaveProperty('table')
      expect(result).toHaveProperty('tableName')
      expect(result).toHaveProperty('roll')
      expect(rollValue).toBeGreaterThanOrEqual(1)
      expect(rollValue).toBeLessThanOrEqual(20)
    })
  })

  describe('default Core Mechanic table', () => {
    test('uses Core Mechanic table by default', () => {
      const [result] = roll()

      expect(result.tableName).toBe('Core Mechanic')
      expect(result.table).toBeDefined()
    })

    test('returns valid hit types', () => {
      const validHits: Hit[] = [
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]

      const [result] = roll()
      expect(validHits).toContain(result.hit)
    })
  })

  describe('roll value interpretation', () => {
    test('roll value matches result roll property', () => {
      const [result, rollValue] = roll()
      expect(result.roll).toBe(rollValue)
    })

    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const results = Array.from({ length: loops }, () => roll())

      results.forEach(([result, rollValue]) => {
        expect(result.roll).toBe(rollValue)
        expect(rollValue).toBeGreaterThanOrEqual(1)
        expect(rollValue).toBeLessThanOrEqual(20)
        expect(result.tableName).toBe('Core Mechanic')
        expect([
          'Nailed It',
          'Success',
          'Tough Choice',
          'Failure',
          'Cascade Failure'
        ]).toContain(result.hit)
      })
    })
  })

  describe('different table names', () => {
    test('handles NPC Action table', () => {
      const [result] = roll('NPC Action')

      expect(result.tableName).toBe('NPC Action')
      expect(result.table).toBeDefined()
      expect([
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]).toContain(result.hit)
    })

    test('handles Critical Damage table', () => {
      const [result] = roll('Critical Damage')

      expect(result.tableName).toBe('Critical Damage')
      expect(result.table).toBeDefined()
      expect([
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]).toContain(result.hit)
    })
  })
})

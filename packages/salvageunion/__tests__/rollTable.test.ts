import { describe, expect, test } from 'bun:test'
import { rollTable } from '../src/rollTable'
import type { SalvageUnionHit } from '../src/types'

describe(rollTable, () => {
  describe('return type', () => {
    test('returns a tuple of [TableResult, number]', () => {
      const result = rollTable()

      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('hit')
      expect(result).toHaveProperty('table')
      expect(result).toHaveProperty('tableName')
      expect(result).toHaveProperty('roll')
    })
  })

  describe('default Core Mechanic table', () => {
    test('uses Core Mechanic table by default', () => {
      const result = rollTable()

      expect(result.tableName).toBe('Core Mechanic')
      expect(result.table).toBeDefined()
    })

    test('returns valid hit types', () => {
      const validHits: SalvageUnionHit[] = [
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]

      const result = rollTable()
      expect(validHits).toContain(result.hit)
    })
  })

  describe('roll value interpretation', () => {
    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const results = Array.from({ length: loops }, () => rollTable())

      results.forEach((result) => {
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
      const result = rollTable('NPC Action')
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
      const result = rollTable('Critical Damage')

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

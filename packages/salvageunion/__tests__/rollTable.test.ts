import { describe, expect, test } from 'bun:test'
import { rollTable } from '../src/rollTable'
import type { SalvageUnionHit, SalvageUnionTableName } from '../src/types'

describe(rollTable, () => {
  describe('default Core Mechanic table', () => {
    test('uses Core Mechanic table by default', () => {
      const { result } = rollTable()

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
      expect(validHits).toContain(result.result.hit)
    })
  })

  describe('roll value interpretation', () => {
    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const results = Array.from({ length: loops }, () => rollTable())

      results.forEach(({ result }) => {
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
      const { result } = rollTable('NPC Action')
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
      const { result } = rollTable('Critical Damage')

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

  describe('input validation', () => {
    test('throws error for invalid table name', () => {
      expect(() => rollTable('Invalid Table' as SalvageUnionTableName)).toThrow(
        'Invalid Salvage Union table name: "Invalid Table". Available tables:'
      )
    })

    test('throws error for non-existent table', () => {
      expect(() => rollTable('Nonexistent' as SalvageUnionTableName)).toThrow(
        'Invalid Salvage Union table name: "Nonexistent"'
      )
    })

    test('handles all valid table names', () => {
      const validTables = [
        'Core Mechanic',
        'NPC Action',
        'Reaction',
        'Morale',
        'Group Initiative',
        'Retreat',
        'Critical Damage',
        'Critical Injury',
        'Reactor Overload',
        'Area Salvage',
        'Mech Salvage'
      ]

      validTables.forEach((tableName) => {
        expect(() =>
          rollTable(tableName as SalvageUnionTableName)
        ).not.toThrow()
        const { result } = rollTable(tableName as SalvageUnionTableName)
        expect(result.tableName).toBe(tableName as SalvageUnionTableName)
      })
    })
  })
})

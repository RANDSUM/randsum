import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/games/salvageunion'

describe('roll', () => {
  describe('default Core Mechanic table', () => {
    test('uses Core Mechanic table by default', () => {
      const { result } = roll('Core Mechanic')

      expect(result.tableName).toBe('Core Mechanic')
      expect(result.table).toBeDefined()
    })
  })

  describe('roll value interpretation', () => {
    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const results = Array.from({ length: loops }, () => roll('Core Mechanic'))

      results.forEach(({ result }) => {
        expect(result.tableName).toBe('Core Mechanic')
      })
    })
  })

  describe('different table names', () => {
    test('handles NPC Action table', () => {
      const { result } = roll('NPC Action')
      expect(result.tableName).toBe('NPC Action')
      expect(result.table).toBeDefined()
      expect(result.label).toBeDefined()
      expect(result.description).toBeDefined()
    })

    test('handles Critical Damage table', () => {
      const { result } = roll('Critical Damage')

      expect(result.tableName).toBe('Critical Damage')
      expect(result.table).toBeDefined()
      expect(result.label).toBeDefined()
      expect(result.description).toBeDefined()
    })
  })

  describe('input validation', () => {
    test('throws error for invalid table name', () => {
      expect(() => roll('Invalid Table')).toThrow(
        'Invalid Salvage Union table name: "Invalid Table"'
      )
    })

    test('throws error for non-existent table', () => {
      expect(() => roll('Nonexistent')).toThrow('Invalid Salvage Union table name: "Nonexistent"')
    })

    test('handles all valid table names', () => {
      const validTables = [
        'Core Mechanic',
        'NPC Action',
        'Morale',
        'Group Initiative',
        'Retreat',
        'Critical Damage',
        'Critical Injury',
        'Reactor Overload',
        'Area Salvage',
        'Mech Salvage',
        'Crawler Deterioration',
        'Crawler Damage',
        'Crawler Destruction',
        'Keepsake',
        'Motto',
        'Pilot Appearance',
        'A.I. Personality',
        'Quirks',
        'Mech Appearance',
        'Mech Pattern Names',
        'Crawler Name',
        'Reaction Roll',
        'Mechapult'
      ]

      validTables.forEach(tableName => {
        expect(() => roll(tableName)).not.toThrow()
        const { result } = roll(tableName)
        expect(result.tableName).toBe(tableName)
      })
    })
  })
})

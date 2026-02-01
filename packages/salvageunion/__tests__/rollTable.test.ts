import { describe, expect, spyOn, test } from 'bun:test'
import { rollTable } from '../src/rollTable'
import type { SalvageUnionTableName } from '../src/types'
import * as roller from '@randsum/roller'
import type { RollerRollResult } from '@randsum/roller'
import * as suRef from 'salvageunion-reference'

describe('rollTable', () => {
  describe('default Core Mechanic table', () => {
    test('uses Core Mechanic table by default', () => {
      const { result } = rollTable()

      expect(result.tableName).toBe('Core Mechanic')
      expect(result.table).toBeDefined()
    })
  })

  describe('roll value interpretation', () => {
    test('returns consistent results across multiple rolls', () => {
      const loops = 50
      const results = Array.from({ length: loops }, () => rollTable())

      results.forEach(({ result }) => {
        expect(result.tableName).toBe('Core Mechanic')
      })
    })
  })

  describe('different table names', () => {
    test('handles NPC Action table', () => {
      const { result } = rollTable('NPC Action')
      expect(result.tableName).toBe('NPC Action')
      expect(result.table).toBeDefined()
      expect(result.label).toBeDefined()
      expect(result.description).toBeDefined()
    })

    test('handles Critical Damage table', () => {
      const { result } = rollTable('Critical Damage')

      expect(result.tableName).toBe('Critical Damage')
      expect(result.table).toBeDefined()
      expect(result.label).toBeDefined()
      expect(result.description).toBeDefined()
    })
  })

  describe('input validation', () => {
    test('throws error for invalid table name', () => {
      expect(() => rollTable('Invalid Table' as SalvageUnionTableName)).toThrow(
        'Invalid Salvage Union table name: "Invalid Table"'
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
        expect(() => rollTable(tableName)).not.toThrow()
        const { result } = rollTable(tableName)
        expect(result.tableName).toBe(tableName)
      })
    })
  })

  describe('mocked roll results', () => {
    test('returns correct label and description for Core Mechanic table with roll of 10', () => {
      const mockRollResult = {
        total: 10,
        rolls: [
          {
            description: ['1d20'],
            parameters: {
              quantity: 1,
              sides: 20,
              arithmetic: 'add' as const,
              modifiers: {},
              key: 'Roll 1',
              argument: { sides: 20 },
              notation: '1d20' as const,
              description: ['1d20'],
              faces: undefined
            },
            rolls: [10],
            modifierHistory: {
              logs: [],
              modifiedRolls: [10],
              total: 10,
              initialRolls: [10]
            },
            appliedTotal: 10,
            total: 10
          }
        ],
        result: ['10']
      }

      const rollSpy = spyOn(roller, 'roll').mockReturnValue(mockRollResult as RollerRollResult)

      const { result } = rollTable('Core Mechanic')

      expect(result.tableName).toBe('Core Mechanic')
      expect(result.roll).toBe(10)
      expect(result.label).toBe('Tough Choice')
      expect(result.description).toBe(
        'You succeed in your action, but at a cost. The Mediator gives you a Tough Choice with some kind of Setback attached. When attacking, you hit, but must make a Tough Choice.'
      )
      expect(rollSpy).toHaveBeenCalledTimes(1)
      expect(rollSpy).toHaveBeenCalledWith({ sides: 20 })

      rollSpy.mockRestore()
    })

    test('returns correct label and description for Quirks table with roll of 15', () => {
      const mockRollResult = {
        total: 15,
        rolls: [
          {
            description: ['1d20'],
            parameters: {
              quantity: 1,
              sides: 20,
              arithmetic: 'add' as const,
              modifiers: {},
              key: 'Roll 1',
              argument: { sides: 20 },
              notation: '1d20' as const,
              description: ['1d20'],
              faces: undefined
            },
            rolls: [15],
            modifierHistory: {
              logs: [],
              modifiedRolls: [15],
              total: 15,
              initialRolls: [15]
            },
            appliedTotal: 15,
            total: 15
          }
        ],
        result: ['15']
      }

      const rollSpy = spyOn(roller, 'roll').mockReturnValue(mockRollResult as RollerRollResult)

      const { result } = rollTable('Quirks')

      expect(result.tableName).toBe('Quirks')
      expect(result.roll).toBe(15)
      expect(result.label).toBe('Small organic growths')
      expect(result.description).toBe('')
      expect(rollSpy).toHaveBeenCalledTimes(1)
      expect(rollSpy).toHaveBeenCalledWith({ sides: 20 })

      rollSpy.mockRestore()
    })

    test('throws error when table result fails', () => {
      const mockRollResult = {
        total: 10,
        rolls: [
          {
            description: ['1d20'],
            parameters: {
              quantity: 1,
              sides: 20,
              arithmetic: 'add' as const,
              modifiers: {},
              key: 'Roll 1',
              argument: { sides: 20 },
              notation: '1d20' as const,
              description: ['1d20'],
              faces: undefined
            },
            rolls: [10],
            modifierHistory: {
              logs: [],
              modifiedRolls: [10],
              total: 10,
              initialRolls: [10]
            },
            appliedTotal: 10,
            total: 10
          }
        ],
        result: ['10']
      }

      const rollSpy = spyOn(roller, 'roll').mockReturnValue(mockRollResult as RollerRollResult)
      const resultSpy = spyOn(suRef, 'resultForTable').mockReturnValue({
        success: false,
        result: null,
        key: ''
      })

      expect(() => rollTable('Core Mechanic')).toThrow(
        'Failed to get result from table: "Core Mechanic"'
      )

      rollSpy.mockRestore()
      resultSpy.mockRestore()
    })
  })
})

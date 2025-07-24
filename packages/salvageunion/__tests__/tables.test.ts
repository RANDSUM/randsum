import { describe, expect, test } from 'bun:test'
import {
  AreaSalvageTable,
  CoreMechanicTable,
  CriticalDamageTable,
  CriticalInjuryTable,
  GroupInitiativeTable,
  MechSalvageTable,
  NPCActionTable,
  NPCReactionTable,
  NPMoraleTable,
  ReactorOverloadTable,
  RetreatTable
} from '../src/tables'
import type { SalvageUnionHit, SalvageUnionTableType } from '../src/types'

describe('Salvageunion Tables', () => {
  describe('table structure validation', () => {
    const tables = [
      { name: 'NPCActionTable', table: NPCActionTable },
      { name: 'NPCReactionTable', table: NPCReactionTable },
      { name: 'NPMoraleTable', table: NPMoraleTable },
      { name: 'CoreMechanicTable', table: CoreMechanicTable },
      { name: 'GroupInitiativeTable', table: GroupInitiativeTable },
      { name: 'RetreatTable', table: RetreatTable },
      { name: 'CriticalDamageTable', table: CriticalDamageTable },
      { name: 'CriticalInjuryTable', table: CriticalInjuryTable },
      { name: 'ReactorOverloadTable', table: ReactorOverloadTable },
      { name: 'AreaSalvageTable', table: AreaSalvageTable },
      { name: 'MechSalvageTable', table: MechSalvageTable }
    ]

    tables.forEach(({ name, table }) => {
      test(`${name} has correct structure`, () => {
        expect(typeof table).toBe('object')
        expect(table).not.toBeNull()

        const entries = Object.keys(table)
        expect(entries.length).toBeGreaterThan(0)

        entries.forEach(key => {
          const entry = table[key as SalvageUnionHit]
          expect(entry).toHaveProperty('label')
          expect(entry).toHaveProperty('description')
          expect(entry).toHaveProperty('hit')

          expect(typeof entry.label).toBe('string')
          expect(typeof entry.description).toBe('string')
          expect(typeof entry.hit).toBe('string')

          expect(entry.label.length).toBeGreaterThan(0)
          expect(entry.description.length).toBeGreaterThan(0)
          expect(entry.hit.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('NPCActionTable', () => {
    test('contains expected result types', () => {
      const expectedHits: SalvageUnionHit[] = [
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]

      expectedHits.forEach(hit => {
        expect(NPCActionTable).toHaveProperty(hit)
        expect(NPCActionTable[hit].hit).toBe(hit)
      })
    })

    test('has meaningful descriptions for each result', () => {
      Object.values(NPCActionTable).forEach(entry => {
        expect(entry.description).toContain('NPC')
        expect(entry.description.length).toBeGreaterThan(20)
      })
    })

    test('Nailed It result includes bonus language', () => {
      const nailedIt = NPCActionTable['Nailed It']
      expect(nailedIt.description).toContain('bonus')
      expect(nailedIt.description).toContain('spectacularly')
    })

    test('Cascade Failure result includes severe consequences', () => {
      const cascadeFailure = NPCActionTable['Cascade Failure']
      expect(cascadeFailure.description).toContain('catastrophically')
      expect(cascadeFailure.description).toContain('Severe Setback')
    })
  })

  describe('NPCReactionTable', () => {
    test('contains expected result types', () => {
      const expectedHits: SalvageUnionHit[] = [
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]

      expectedHits.forEach(hit => {
        expect(NPCReactionTable).toHaveProperty(hit)
        expect(NPCReactionTable[hit].hit).toBe(hit)
      })
    })

    test('describes different levels of NPC friendliness', () => {
      const nailedIt = NPCReactionTable['Nailed It']
      const success = NPCReactionTable.Success
      const failure = NPCReactionTable.Failure

      expect(nailedIt.label).toContain('Friendly')
      expect(success.label).toContain('Friendly')
      expect(failure.label).not.toContain('Friendly')
    })
  })

  describe('salvage tables', () => {
    const salvageTables = [
      { name: 'AreaSalvageTable', table: AreaSalvageTable },
      { name: 'MechSalvageTable', table: MechSalvageTable }
    ]

    salvageTables.forEach(({ name, table }) => {
      test(`${name} contains standard result types`, () => {
        const expectedHits: SalvageUnionHit[] = [
          'Nailed It',
          'Success',
          'Tough Choice',
          'Failure',
          'Cascade Failure'
        ]

        expectedHits.forEach(hit => {
          expect(table).toHaveProperty(hit)
          expect(table[hit].hit).toBe(hit)
        })
      })

      test(`${name} has salvage-specific descriptions`, () => {
        Object.values(table).forEach(entry => {
          expect(entry.description.length).toBeGreaterThan(10)
          expect(typeof entry.label).toBe('string')
        })
      })
    })
  })

  describe('combat tables', () => {
    const combatTables = [
      { name: 'GroupInitiativeTable', table: GroupInitiativeTable },
      { name: 'RetreatTable', table: RetreatTable }
    ]

    combatTables.forEach(({ name, table }) => {
      test(`${name} contains standard result types`, () => {
        const expectedHits: SalvageUnionHit[] = [
          'Nailed It',
          'Success',
          'Tough Choice',
          'Failure',
          'Cascade Failure'
        ]

        expectedHits.forEach(hit => {
          expect(table).toHaveProperty(hit)
          expect(table[hit].hit).toBe(hit)
        })
      })

      test(`${name} describes combat outcomes`, () => {
        Object.values(table).forEach(entry => {
          expect(entry.description.length).toBeGreaterThan(15)
        })
      })
    })
  })

  describe('damage tables', () => {
    test('CriticalDamageTable has damage-specific content', () => {
      Object.values(CriticalDamageTable).forEach(entry => {
        expect(entry.description.length).toBeGreaterThan(10)
      })

      const allDescriptions = Object.values(CriticalDamageTable)
        .map(entry => entry.description)
        .join(' ')

      expect(allDescriptions.toLowerCase()).toMatch(/mech|system|damage|critical/i)
    })

    test('CriticalInjuryTable has pilot-specific content', () => {
      Object.values(CriticalInjuryTable).forEach(entry => {
        expect(entry.description.length).toBeGreaterThan(10)
      })

      const allDescriptions = Object.values(CriticalInjuryTable)
        .map(entry => entry.description)
        .join(' ')

      expect(allDescriptions.toLowerCase()).toMatch(/pilot|injury|damage|critical/i)
    })

    test('ReactorOverloadTable has reactor-specific content', () => {
      Object.values(ReactorOverloadTable).forEach(entry => {
        expect(entry.description.length).toBeGreaterThan(10)
      })

      const allDescriptions = Object.values(ReactorOverloadTable)
        .map(entry => entry.description)
        .join(' ')

      expect(allDescriptions.toLowerCase()).toMatch(/reactor|overload|mech/i)
    })
  })

  describe('table consistency', () => {
    test('all tables use consistent hit types', () => {
      const allTables = [
        NPCActionTable,
        NPCReactionTable,
        NPMoraleTable,
        CoreMechanicTable,
        GroupInitiativeTable,
        RetreatTable,
        CriticalDamageTable,
        CriticalInjuryTable,
        ReactorOverloadTable,
        AreaSalvageTable,
        MechSalvageTable
      ]

      const expectedHits: SalvageUnionHit[] = [
        'Nailed It',
        'Success',
        'Tough Choice',
        'Failure',
        'Cascade Failure'
      ]

      allTables.forEach(table => {
        expectedHits.forEach(hit => {
          expect(table).toHaveProperty(hit)
          expect(table[hit].hit).toBe(hit)
        })
      })
    })

    test('all table entries have non-empty required fields', () => {
      const allTables = [
        NPCActionTable,
        NPCReactionTable,
        NPMoraleTable,
        CoreMechanicTable,
        GroupInitiativeTable,
        RetreatTable,
        CriticalDamageTable,
        CriticalInjuryTable,
        ReactorOverloadTable,
        AreaSalvageTable,
        MechSalvageTable
      ]

      allTables.forEach(table => {
        Object.values(table).forEach(entry => {
          expect(entry.label.trim()).not.toBe('')
          expect(entry.description.trim()).not.toBe('')
          expect(entry.hit.trim()).not.toBe('')
        })
      })
    })

    test('hit values match their keys', () => {
      const allTables = [
        NPCActionTable,
        NPCReactionTable,
        NPMoraleTable,
        CoreMechanicTable,
        GroupInitiativeTable,
        RetreatTable,
        CriticalDamageTable,
        CriticalInjuryTable,
        ReactorOverloadTable,
        AreaSalvageTable,
        MechSalvageTable
      ]

      allTables.forEach(table => {
        Object.entries(table).forEach(([key, entry]) => {
          expect(entry.hit).toBe(key as SalvageUnionHit)
        })
      })
    })
  })

  describe('type compliance', () => {
    test('all tables conform to SalvageUnionTableType', () => {
      const allTables: SalvageUnionTableType[] = [
        NPCActionTable,
        NPCReactionTable,
        NPMoraleTable,
        CoreMechanicTable,
        GroupInitiativeTable,
        RetreatTable,
        CriticalDamageTable,
        CriticalInjuryTable,
        ReactorOverloadTable,
        AreaSalvageTable,
        MechSalvageTable
      ]

      allTables.forEach(table => {
        expect(typeof table).toBe('object')
        expect(table).not.toBeNull()

        Object.values(table).forEach(entry => {
          expect(entry).toHaveProperty('label')
          expect(entry).toHaveProperty('description')
          expect(entry).toHaveProperty('hit')
        })
      })
    })

    test('tables can be used with rollTable function', () => {
      const testTable = NPCActionTable

      expect(typeof testTable).toBe('object')
      expect(Object.keys(testTable).length).toBeGreaterThan(0)

      Object.values(testTable).forEach(entry => {
        expect(typeof entry.label).toBe('string')
        expect(typeof entry.description).toBe('string')
        expect(typeof entry.hit).toBe('string')
      })
    })
  })
})

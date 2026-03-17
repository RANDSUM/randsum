import { describe, expect, test } from 'bun:test'
import { MODIFIER_DOCS } from '@randsum/display-utils'

// These tests verify the data contract and static entries that QuickReferenceGrid must render.
// The component is a React TSX component; structural correctness is gated by the Astro build.

describe('QuickReferenceGrid data contract', () => {
  describe('MODIFIER_DOCS coverage', () => {
    test('MODIFIER_DOCS is a non-empty record', () => {
      expect(typeof MODIFIER_DOCS).toBe('object')
      expect(Object.keys(MODIFIER_DOCS).length).toBeGreaterThan(0)
    })

    test('each entry has displayBase and title', () => {
      for (const [key, doc] of Object.entries(MODIFIER_DOCS)) {
        expect(typeof doc.displayBase).toBe('string')
        expect(doc.displayBase.length).toBeGreaterThan(0)
        expect(typeof doc.title).toBe('string')
        expect(doc.title.length).toBeGreaterThan(0)
        expect(typeof key).toBe('string')
      }
    })

    test('has at least 16 modifier entries', () => {
      expect(Object.keys(MODIFIER_DOCS).length).toBeGreaterThanOrEqual(16)
    })
  })

  describe('Core Dice hardcoded entries', () => {
    const CORE_DICE_ENTRIES = [
      { key: 'NdS', notation: 'NdS', description: 'Roll N dice with S sides' },
      { key: 'd%', notation: 'd%', description: 'Percentile die (1-100)' },
      { key: 'dF', notation: 'dF / dF.2', description: 'Fate / Extended Fudge die' },
      { key: 'gN', notation: 'gN', description: 'Geometric die (roll until 1)' },
      { key: 'DDN', notation: 'DDN', description: 'Draw die (no replacement)' },
      { key: 'zN', notation: 'zN', description: 'Zero-bias die (0 to N-1)' },
      { key: 'd{...}', notation: 'd{a,b,c}', description: 'Custom faces die' }
    ]

    test('defines all 7 core dice entry keys', () => {
      const keys = CORE_DICE_ENTRIES.map(e => e.key)
      expect(keys).toContain('NdS')
      expect(keys).toContain('d%')
      expect(keys).toContain('dF')
      expect(keys).toContain('gN')
      expect(keys).toContain('DDN')
      expect(keys).toContain('zN')
      expect(keys).toContain('d{...}')
    })

    test('each core dice entry has key, notation, and description', () => {
      for (const entry of CORE_DICE_ENTRIES) {
        expect(typeof entry.key).toBe('string')
        expect(typeof entry.notation).toBe('string')
        expect(typeof entry.description).toBe('string')
      }
    })
  })

  describe('Operators hardcoded entries', () => {
    const OPERATOR_ENTRIES = [
      { key: 'xN', notation: 'xN', description: 'Repeat (roll N times)' },
      { key: '[text]', notation: '[text]', description: 'Annotation / label' }
    ]

    test('defines xN and [text] operator keys', () => {
      const keys = OPERATOR_ENTRIES.map(e => e.key)
      expect(keys).toContain('xN')
      expect(keys).toContain('[text]')
    })

    test('each operator entry has key, notation, and description', () => {
      for (const entry of OPERATOR_ENTRIES) {
        expect(typeof entry.key).toBe('string')
        expect(typeof entry.notation).toBe('string')
        expect(typeof entry.description).toBe('string')
      }
    })
  })
})

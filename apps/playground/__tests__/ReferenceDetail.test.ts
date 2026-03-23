import { describe, expect, test } from 'bun:test'
import type { NotationDoc } from '@randsum/roller/docs'
import { MODIFIER_DOCS } from '@randsum/roller/docs'

// Tests verify the data contract that ReferenceDetail must render.
// The component is a React TSX component; structural correctness is gated by the Astro build.
// These tests confirm the NotationDoc shape is stable and the component module exports correctly.

describe('ReferenceDetail data contract', () => {
  describe('NotationDoc shape', () => {
    test('each doc has a title string', () => {
      for (const doc of Object.values(MODIFIER_DOCS)) {
        expect(typeof doc.title).toBe('string')
        expect(doc.title.length).toBeGreaterThan(0)
      }
    })

    test('each doc has a description string', () => {
      for (const doc of Object.values(MODIFIER_DOCS)) {
        expect(typeof doc.description).toBe('string')
        expect(doc.description.length).toBeGreaterThan(0)
      }
    })

    test('each doc has a forms array with at least one entry', () => {
      for (const doc of Object.values(MODIFIER_DOCS)) {
        expect(Array.isArray(doc.forms)).toBe(true)
        expect(doc.forms.length).toBeGreaterThan(0)
        for (const form of doc.forms) {
          expect(typeof form.notation).toBe('string')
          expect(typeof form.note).toBe('string')
        }
      }
    })

    test('each doc has an examples array with at least one entry', () => {
      for (const doc of Object.values(MODIFIER_DOCS)) {
        expect(Array.isArray(doc.examples)).toBe(true)
        expect(doc.examples.length).toBeGreaterThan(0)
        for (const example of doc.examples) {
          expect(typeof example.notation).toBe('string')
          expect(typeof example.description).toBe('string')
        }
      }
    })

    test('comparisons is undefined or an array of operator/note objects', () => {
      for (const doc of Object.values(MODIFIER_DOCS)) {
        if (doc.comparisons !== undefined) {
          expect(Array.isArray(doc.comparisons)).toBe(true)
          for (const comparison of doc.comparisons) {
            expect(typeof comparison.operator).toBe('string')
            expect(typeof comparison.note).toBe('string')
          }
        }
      }
    })
  })

  describe('docs with comparisons', () => {
    test('D{..} has comparisons', () => {
      const doc = MODIFIER_DOCS['D{..}']
      expect(doc).toBeDefined()
      expect(doc?.comparisons).toBeDefined()
      expect(doc?.comparisons?.length).toBeGreaterThan(0)
    })

    test('R{..} has comparisons', () => {
      const doc = MODIFIER_DOCS['R{..}']
      expect(doc).toBeDefined()
      expect(doc?.comparisons).toBeDefined()
      expect(doc?.comparisons?.length).toBeGreaterThan(0)
    })

    test('C{..} has comparisons', () => {
      const doc = MODIFIER_DOCS['C{..}']
      expect(doc).toBeDefined()
      expect(doc?.comparisons).toBeDefined()
      expect(doc?.comparisons?.length).toBeGreaterThan(0)
    })
  })

  describe('docs without comparisons', () => {
    test('L does not have comparisons', () => {
      const doc = MODIFIER_DOCS.L
      expect(doc).toBeDefined()
      expect(doc?.comparisons).toBeUndefined()
    })

    test('! (explode) has comparisons for conditional explode', () => {
      const doc = MODIFIER_DOCS['!']
      expect(doc).toBeDefined()
      expect(doc?.comparisons).toBeDefined()
      expect(doc?.comparisons?.length).toBeGreaterThan(0)
    })
  })

  describe('ReferenceDetail component module', () => {
    test('ReferenceDetail.tsx exports a ReferenceDetail function', async () => {
      const mod = (await import('../src/components/ReferenceDetail')) as Record<string, unknown>
      expect(typeof mod.ReferenceDetail).toBe('function')
    })

    test('ReferenceDetail export is a React component (function)', async () => {
      const mod = (await import('../src/components/ReferenceDetail')) as Record<string, unknown>
      const component = mod.ReferenceDetail
      expect(typeof component).toBe('function')
    })
  })

  describe('ReferenceDetail rendering logic (pure helpers)', () => {
    // Test a pure helper that the component would use: checking whether
    // comparisons should be rendered.
    function hasComparisons(doc: NotationDoc): boolean {
      return doc.comparisons !== undefined && doc.comparisons.length > 0
    }

    test('hasComparisons returns true for docs with comparisons', () => {
      const doc = MODIFIER_DOCS['D{..}']
      expect(doc).toBeDefined()
      if (doc) {
        expect(hasComparisons(doc)).toBe(true)
      }
    })

    test('hasComparisons returns false for docs without comparisons', () => {
      const doc = MODIFIER_DOCS.L
      expect(doc).toBeDefined()
      if (doc) {
        expect(hasComparisons(doc)).toBe(false)
      }
    })

    test('hasComparisons returns false for docs with undefined comparisons', () => {
      const doc: NotationDoc = {
        key: 'T',
        category: 'Order',
        title: 'Test',
        description: 'A test doc',
        displayBase: 'T',
        color: '#000000',
        colorLight: '#000000',
        forms: [{ notation: 'T', note: 'test form' }],
        examples: [{ description: 'test example', notation: '1dT' }]
      }
      expect(hasComparisons(doc)).toBe(false)
    })
  })
})

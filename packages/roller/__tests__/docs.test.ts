import { describe, expect, test } from 'bun:test'
import { MODIFIER_DOCS } from '../src/docs/index'
import type { ModifierDoc, NotationDoc } from '../src/docs/index'
import type { NotationSchema } from '../src/notation/schema'

describe('MODIFIER_DOCS', () => {
  test('is a non-empty record', () => {
    expect(typeof MODIFIER_DOCS).toBe('object')
    expect(Object.keys(MODIFIER_DOCS).length).toBeGreaterThan(0)
  })

  test('every entry has required shape', () => {
    for (const [key, doc] of Object.entries(MODIFIER_DOCS)) {
      expect(typeof doc.title).toBe('string')
      expect(typeof doc.description).toBe('string')
      expect(typeof doc.displayBase).toBe('string')
      expect(Array.isArray(doc.forms)).toBe(true)
      expect(doc.forms.length).toBeGreaterThan(0)
      expect(Array.isArray(doc.examples)).toBe(true)
      expect(doc.examples.length).toBeGreaterThan(0)
      for (const form of doc.forms) {
        expect(typeof form.notation).toBe('string')
        expect(typeof form.note).toBe('string')
      }
      for (const example of doc.examples) {
        expect(typeof example.notation).toBe('string')
        expect(typeof example.description).toBe('string')
      }
      if (doc.comparisons !== undefined) {
        expect(Array.isArray(doc.comparisons)).toBe(true)
        for (const comp of doc.comparisons) {
          expect(typeof comp.operator).toBe('string')
          expect(typeof comp.note).toBe('string')
        }
      }
      void key
    }
  })

  test('contains known modifier keys', () => {
    expect(MODIFIER_DOCS['L']).toBeDefined()
    expect(MODIFIER_DOCS['H']).toBeDefined()
    expect(MODIFIER_DOCS['!']).toBeDefined()
    expect(MODIFIER_DOCS['R{..}']).toBeDefined()
    expect(MODIFIER_DOCS['xDN']).toBeDefined()
  })

  test('ModifierDoc type is usable', () => {
    const doc: ModifierDoc = MODIFIER_DOCS['L']!
    expect(doc.title).toBe('Drop Lowest')
  })
})

describe('NotationDoc', () => {
  test('NotationDoc type is exported and assignable from ModifierDoc', () => {
    // ModifierDoc is a type alias for NotationDoc — they are structurally identical
    const doc: NotationDoc = {
      key: 'L',
      category: 'Pool',
      title: 'Drop Lowest',
      description: 'Remove the lowest die',
      displayBase: 'L',
      forms: [{ notation: 'L', note: 'Drop 1 lowest' }],
      examples: [{ notation: '4d6L', description: 'Drop lowest' }]
    }
    expect(doc.key).toBe('L')
    expect(doc.category).toBe('Pool')
    expect(doc.title).toBe('Drop Lowest')
  })

  test('ModifierDoc is a backwards-compatible alias for NotationDoc', () => {
    const doc: ModifierDoc = {
      key: 'H',
      category: 'Pool',
      title: 'Drop Highest',
      description: 'Remove the highest die',
      displayBase: 'H',
      forms: [{ notation: 'H', note: 'Drop 1 highest' }],
      examples: [{ notation: '2d20H', description: 'Drop highest' }]
    }
    expect(doc.key).toBe('H')
    expect(doc.category).toBe('Pool')
  })
})

describe('NotationSchema.docs', () => {
  test('NotationSchema accepts optional docs field', () => {
    const doc: NotationDoc = {
      key: '!',
      category: 'Explode',
      title: 'Explode',
      description: 'Explode on max',
      displayBase: '!',
      forms: [{ notation: '!', note: 'Explode on max' }],
      examples: [{ notation: '3d6!', description: 'Explode' }]
    }
    // Type-level check: NotationSchema should accept a docs array
    const schemaWithDocs: Pick<NotationSchema, 'docs'> = {
      docs: [doc]
    }
    expect(schemaWithDocs.docs).toHaveLength(1)
    expect(schemaWithDocs.docs![0]!.key).toBe('!')
  })

  test('NotationSchema docs field is optional', () => {
    const schemaWithoutDocs: Pick<NotationSchema, 'docs'> = {}
    expect(schemaWithoutDocs.docs).toBeUndefined()
  })
})

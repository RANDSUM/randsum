import { describe, expect, test } from 'bun:test'
import { MODIFIER_DOCS } from '../src/docs/index'
import type { ModifierDoc } from '../src/docs/index'

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

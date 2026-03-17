import { describe, expect, test } from 'bun:test'
import { MODIFIER_DOCS } from '../src/modifierDocs'

describe('MODIFIER_DOCS', () => {
  test('subtract modifier uses hyphen key, not en-dash', () => {
    expect(MODIFIER_DOCS['-']).toBeDefined()
    expect(MODIFIER_DOCS['\u2013']).toBeUndefined()
  })

  test('every modifier doc has required fields', () => {
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      expect(typeof doc.title).toBe('string')
      expect(typeof doc.description).toBe('string')
      expect(typeof doc.displayBase).toBe('string')
      expect(Array.isArray(doc.forms)).toBe(true)
      expect(Array.isArray(doc.examples)).toBe(true)
      expect(doc.forms.length).toBeGreaterThan(0)
      expect(doc.examples.length).toBeGreaterThan(0)
    }
  })

  test('every form has notation and note', () => {
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      for (const form of doc.forms) {
        expect(typeof form.notation).toBe('string')
        expect(typeof form.note).toBe('string')
      }
    }
  })

  test('every example has notation and description', () => {
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      for (const ex of doc.examples) {
        expect(typeof ex.notation).toBe('string')
        expect(typeof ex.description).toBe('string')
      }
    }
  })

  test('modifiers with comparisons have operator and note', () => {
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      if (doc.comparisons) {
        for (const comp of doc.comparisons) {
          expect(typeof comp.operator).toBe('string')
          expect(typeof comp.note).toBe('string')
        }
      }
    }
  })

  test('contains expected modifier keys', () => {
    const expectedKeys = [
      'xDN',
      'L',
      'H',
      'K',
      'KL',
      'KM',
      '!',
      '!!',
      '!p',
      '!s{..}',
      '!i',
      '!r',
      'U',
      'R{..}',
      'ro{..}',
      'D{..}',
      'V{..}',
      'S{..}',
      '#{..}',
      'F{..}',
      '+',
      '-',
      'ms{..}',
      '*',
      '**',
      'C{..}',
      'W'
    ]
    for (const key of expectedKeys) {
      expect(key in MODIFIER_DOCS).toBe(true)
    }
  })
})

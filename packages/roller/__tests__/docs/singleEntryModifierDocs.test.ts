import { describe, expect, test } from 'bun:test'
import {
  capDocs,
  compoundDocs,
  explodeDocs,
  integerDivideDocs,
  minusDocs,
  moduloDocs,
  multiplyDocs,
  multiplyTotalDocs,
  penetrateDocs,
  plusDocs,
  replaceDocs,
  sortDocs,
  uniqueDocs,
  wildDieDocs
} from '../../src/docs/modifierDocData'

describe('single-entry modifier docs (S3)', () => {
  const singleEntryDocs = [
    { name: 'cap', docs: capDocs, expectedKey: 'C{..}' },
    { name: 'replace', docs: replaceDocs, expectedKey: 'V{..}' },
    { name: 'explode', docs: explodeDocs, expectedKey: '!' },
    { name: 'compound', docs: compoundDocs, expectedKey: '!!' },
    { name: 'penetrate', docs: penetrateDocs, expectedKey: '!p' },
    { name: 'wildDie', docs: wildDieDocs, expectedKey: 'W' },
    { name: 'unique', docs: uniqueDocs, expectedKey: 'U' },
    { name: 'multiply', docs: multiplyDocs, expectedKey: '*' },
    { name: 'plus', docs: plusDocs, expectedKey: '+' },
    { name: 'minus', docs: minusDocs, expectedKey: '-' },
    { name: 'integerDivide', docs: integerDivideDocs, expectedKey: '//' },
    { name: 'modulo', docs: moduloDocs, expectedKey: '%' },
    { name: 'sort', docs: sortDocs, expectedKey: 'sort' },
    { name: 'multiplyTotal', docs: multiplyTotalDocs, expectedKey: '**' }
  ] as const

  for (const { name, docs, expectedKey } of singleEntryDocs) {
    test(`${name} has a docs array with exactly 1 entry (key: '${expectedKey}')`, () => {
      expect(docs.length).toBe(1)
      expect(docs[0]!.key).toBe(expectedKey)
    })
  }

  test('each single-entry docs entry has required NotationDoc fields', () => {
    for (const { docs } of singleEntryDocs) {
      const doc = docs[0]!
      expect(typeof doc.key).toBe('string')
      expect(typeof doc.category).toBe('string')
      expect(typeof doc.title).toBe('string')
      expect(typeof doc.description).toBe('string')
      expect(typeof doc.displayBase).toBe('string')
      expect(typeof doc.color).toBe('string')
      expect(typeof doc.colorLight).toBe('string')
      expect(Array.isArray(doc.forms)).toBe(true)
      expect(doc.forms.length).toBeGreaterThan(0)
      expect(Array.isArray(doc.examples)).toBe(true)
      expect(doc.examples.length).toBeGreaterThan(0)
    }
  })

  test('no single-entry docs entry has a displayOptional field', () => {
    for (const { docs } of singleEntryDocs) {
      const doc = docs[0]!
      expect('displayOptional' in doc).toBe(false)
    }
  })
})

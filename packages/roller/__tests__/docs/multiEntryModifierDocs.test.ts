import { describe, expect, test } from 'bun:test'
import {
  countDocs,
  dropDocs,
  explodeSequenceDocs,
  keepDocs,
  rerollDocs
} from '../../src/docs/modifierDocData'

describe('multi-entry modifier docs (S2)', () => {
  describe('dropDocs', () => {
    test('has a docs array with 3 entries', () => {
      expect(dropDocs.length).toBe(3)
    })

    test('entry keys are L, H, D{..}', () => {
      const keys = dropDocs.map(d => d.key)
      expect(keys).toContain('L')
      expect(keys).toContain('H')
      expect(keys).toContain('D{..}')
    })
  })

  describe('keepDocs', () => {
    test('has a docs array with 3 entries', () => {
      expect(keepDocs.length).toBe(3)
    })

    test('entry keys are K, KL, KM', () => {
      const keys = keepDocs.map(d => d.key)
      expect(keys).toContain('K')
      expect(keys).toContain('KL')
      expect(keys).toContain('KM')
    })
  })

  describe('countDocs', () => {
    test('has a docs array with 4 entries', () => {
      expect(countDocs.length).toBe(4)
    })

    test('entry keys are #{..}, S{..}, F{..}, ms{..}', () => {
      const keys = countDocs.map(d => d.key)
      expect(keys).toContain('#{..}')
      expect(keys).toContain('S{..}')
      expect(keys).toContain('F{..}')
      expect(keys).toContain('ms{..}')
    })
  })

  describe('rerollDocs', () => {
    test('has a docs array with 2 entries', () => {
      expect(rerollDocs.length).toBe(2)
    })

    test('entry keys are R{..} and ro{..}', () => {
      const keys = rerollDocs.map(d => d.key)
      expect(keys).toContain('R{..}')
      expect(keys).toContain('ro{..}')
    })
  })

  describe('explodeSequenceDocs', () => {
    test('has a docs array with 3 entries', () => {
      expect(explodeSequenceDocs.length).toBe(3)
    })

    test('entry keys are !s{..}, !i, !r', () => {
      const keys = explodeSequenceDocs.map(d => d.key)
      expect(keys).toContain('!s{..}')
      expect(keys).toContain('!i')
      expect(keys).toContain('!r')
    })
  })

  describe('no displayOptional field in any docs entry', () => {
    const groups = [
      { name: 'dropDocs', docs: dropDocs },
      { name: 'keepDocs', docs: keepDocs },
      { name: 'countDocs', docs: countDocs },
      { name: 'rerollDocs', docs: rerollDocs },
      { name: 'explodeSequenceDocs', docs: explodeSequenceDocs }
    ] as const

    for (const { name, docs } of groups) {
      test(`${name} entries have no displayOptional`, () => {
        for (const doc of docs) {
          expect('displayOptional' in doc).toBe(false)
        }
      })
    }
  })
})

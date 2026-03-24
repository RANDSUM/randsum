import { describe, expect, test } from 'bun:test'
import { dropSchema } from '../../src/modifiers/drop'
import { keepSchema } from '../../src/modifiers/keep'
import { countSchema } from '../../src/modifiers/count'
import { rerollSchema } from '../../src/modifiers/reroll'
import { explodeSequenceSchema } from '../../src/modifiers/explodeSequence'

describe('multi-entry modifier docs (S2)', () => {
  describe('dropSchema.docs', () => {
    test('has a docs array with 3 entries', () => {
      expect(dropSchema.docs).toBeDefined()
      expect(dropSchema.docs!.length).toBe(3)
    })

    test('entry keys are L, H, D{..}', () => {
      const keys = dropSchema.docs!.map(d => d.key)
      expect(keys).toContain('L')
      expect(keys).toContain('H')
      expect(keys).toContain('D{..}')
    })
  })

  describe('keepSchema.docs', () => {
    test('has a docs array with 3 entries', () => {
      expect(keepSchema.docs).toBeDefined()
      expect(keepSchema.docs!.length).toBe(3)
    })

    test('entry keys are K, KL, KM', () => {
      const keys = keepSchema.docs!.map(d => d.key)
      expect(keys).toContain('K')
      expect(keys).toContain('KL')
      expect(keys).toContain('KM')
    })
  })

  describe('countSchema.docs', () => {
    test('has a docs array with 4 entries', () => {
      expect(countSchema.docs).toBeDefined()
      expect(countSchema.docs!.length).toBe(4)
    })

    test('entry keys are #{..}, S{..}, F{..}, ms{..}', () => {
      const keys = countSchema.docs!.map(d => d.key)
      expect(keys).toContain('#{..}')
      expect(keys).toContain('S{..}')
      expect(keys).toContain('F{..}')
      expect(keys).toContain('ms{..}')
    })
  })

  describe('rerollSchema.docs', () => {
    test('has a docs array with 2 entries', () => {
      expect(rerollSchema.docs).toBeDefined()
      expect(rerollSchema.docs!.length).toBe(2)
    })

    test('entry keys are R{..} and ro{..}', () => {
      const keys = rerollSchema.docs!.map(d => d.key)
      expect(keys).toContain('R{..}')
      expect(keys).toContain('ro{..}')
    })
  })

  describe('explodeSequenceSchema.docs', () => {
    test('has a docs array with 3 entries', () => {
      expect(explodeSequenceSchema.docs).toBeDefined()
      expect(explodeSequenceSchema.docs!.length).toBe(3)
    })

    test('entry keys are !s{..}, !i, !r', () => {
      const keys = explodeSequenceSchema.docs!.map(d => d.key)
      expect(keys).toContain('!s{..}')
      expect(keys).toContain('!i')
      expect(keys).toContain('!r')
    })
  })

  describe('no displayOptional field in any docs entry', () => {
    test('dropSchema docs entries have no displayOptional', () => {
      for (const doc of dropSchema.docs ?? []) {
        expect('displayOptional' in doc).toBe(false)
      }
    })

    test('keepSchema docs entries have no displayOptional', () => {
      for (const doc of keepSchema.docs ?? []) {
        expect('displayOptional' in doc).toBe(false)
      }
    })

    test('countSchema docs entries have no displayOptional', () => {
      for (const doc of countSchema.docs ?? []) {
        expect('displayOptional' in doc).toBe(false)
      }
    })

    test('rerollSchema docs entries have no displayOptional', () => {
      for (const doc of rerollSchema.docs ?? []) {
        expect('displayOptional' in doc).toBe(false)
      }
    })

    test('explodeSequenceSchema docs entries have no displayOptional', () => {
      for (const doc of explodeSequenceSchema.docs ?? []) {
        expect('displayOptional' in doc).toBe(false)
      }
    })
  })
})

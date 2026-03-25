import { describe, expect, test } from 'bun:test'
import { capSchema } from '../../src/modifiers/cap'
import { replaceSchema } from '../../src/modifiers/replace'
import { explodeSchema } from '../../src/modifiers/explode'
import { compoundSchema } from '../../src/modifiers/compound'
import { penetrateSchema } from '../../src/modifiers/penetrate'
import { wildDieSchema } from '../../src/modifiers/wildDie'
import { uniqueSchema } from '../../src/modifiers/unique'
import { multiplySchema } from '../../src/modifiers/multiply'
import { plusSchema } from '../../src/modifiers/plus'
import { minusSchema } from '../../src/modifiers/minus'
import { integerDivideSchema } from '../../src/modifiers/integerDivide'
import { moduloSchema } from '../../src/modifiers/modulo'
import { sortSchema } from '../../src/modifiers/sort'
import { multiplyTotalSchema } from '../../src/modifiers/multiplyTotal'

describe('single-entry modifier docs (S3)', () => {
  const singleEntrySchemas = [
    { schema: capSchema, expectedKey: 'C{..}' },
    { schema: replaceSchema, expectedKey: 'V{..}' },
    { schema: explodeSchema, expectedKey: '!' },
    { schema: compoundSchema, expectedKey: '!!' },
    { schema: penetrateSchema, expectedKey: '!p' },
    { schema: wildDieSchema, expectedKey: 'W' },
    { schema: uniqueSchema, expectedKey: 'U' },
    { schema: multiplySchema, expectedKey: '*' },
    { schema: plusSchema, expectedKey: '+' },
    { schema: minusSchema, expectedKey: '-' },
    { schema: integerDivideSchema, expectedKey: '//' },
    { schema: moduloSchema, expectedKey: '%' },
    { schema: sortSchema, expectedKey: 'sort' },
    { schema: multiplyTotalSchema, expectedKey: '**' }
  ] as const

  for (const { schema, expectedKey } of singleEntrySchemas) {
    test(`${schema.name}Schema has a docs array with exactly 1 entry (key: '${expectedKey}')`, () => {
      expect(schema.docs).toBeDefined()
      expect(schema.docs!.length).toBe(1)
      expect(schema.docs![0]!.key).toBe(expectedKey)
    })
  }

  test('each single-entry schema docs entry has required NotationDoc fields', () => {
    for (const { schema } of singleEntrySchemas) {
      const doc = schema.docs![0]!
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

  test('no single-entry schema docs entry has a displayOptional field', () => {
    for (const { schema } of singleEntrySchemas) {
      const doc = schema.docs![0]!
      expect('displayOptional' in doc).toBe(false)
    }
  })
})

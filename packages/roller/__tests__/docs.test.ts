import { describe, expect, test } from 'bun:test'
import { DICE_DOCS, MODIFIER_DOCS, NOTATION_DOCS } from '../src/docs/index'
import type { ModifierDoc, NotationDoc } from '../src/docs/index'
import type { NotationSchema } from '../src/notation/schema'
import { RANDSUM_MODIFIERS } from '../src/modifiers/definitions'
import { RANDSUM_DICE_SCHEMAS } from '../src/dice/index'

function checkNotationDocShape(doc: NotationDoc, key: string): void {
  expect(typeof doc.key).toBe('string')
  expect(doc.key.length).toBeGreaterThan(0)
  expect(typeof doc.category).toBe('string')
  expect(doc.category.length).toBeGreaterThan(0)
  expect(typeof doc.color).toBe('string')
  expect(doc.color.length).toBeGreaterThan(0)
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

describe('MODIFIER_DOCS', () => {
  test('is a non-empty record', () => {
    expect(typeof MODIFIER_DOCS).toBe('object')
    expect(Object.keys(MODIFIER_DOCS).length).toBeGreaterThan(0)
  })

  test('every entry has required shape including key and category', () => {
    for (const [key, doc] of Object.entries(MODIFIER_DOCS)) {
      checkNotationDocShape(doc, key)
    }
  })

  test('contains known modifier keys', () => {
    expect(MODIFIER_DOCS['L']).toBeDefined()
    expect(MODIFIER_DOCS['H']).toBeDefined()
    expect(MODIFIER_DOCS['!']).toBeDefined()
    expect(MODIFIER_DOCS['R{..}']).toBeDefined()
    expect(MODIFIER_DOCS['sort']).toBeDefined()
  })

  test('xDN is not in MODIFIER_DOCS (moved to DICE_DOCS)', () => {
    expect(MODIFIER_DOCS['xDN']).toBeUndefined()
  })

  test('ModifierDoc type is usable', () => {
    const doc: ModifierDoc = MODIFIER_DOCS['L']!
    expect(doc.title).toBe('Drop Lowest')
  })
})

describe('NotationDoc', () => {
  test('NotationDoc type is exported and assignable from ModifierDoc', () => {
    const doc: NotationDoc = {
      key: 'L',
      category: 'Pool',
      color: '#fb7185',
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
      color: '#fb7185',
      title: 'Drop Highest',
      description: 'Remove the highest die',
      displayBase: 'H',
      forms: [{ notation: 'H', note: 'Drop 1 highest' }],
      examples: [{ notation: '2d20H', description: 'Drop highest' }]
    }
    expect(doc.key).toBe('H')
    expect(doc.category).toBe('Pool')
  })

  test('NotationDoc type is usable', () => {
    const doc: NotationDoc = MODIFIER_DOCS['L']!
    expect(doc.title).toBe('Drop Lowest')
    expect(doc.key).toBe('L')
    expect(doc.category).toBe('Pool')
  })
})

describe('NotationSchema.docs', () => {
  test('NotationSchema accepts optional docs field', () => {
    const doc: NotationDoc = {
      key: '!',
      category: 'Explode',
      color: '#fbbf24',
      title: 'Explode',
      description: 'Explode on max',
      displayBase: '!',
      forms: [{ notation: '!', note: 'Explode on max' }],
      examples: [{ notation: '3d6!', description: 'Explode' }]
    }
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

describe('DICE_DOCS', () => {
  test('is a non-empty record', () => {
    expect(typeof DICE_DOCS).toBe('object')
    expect(Object.keys(DICE_DOCS).length).toBeGreaterThan(0)
  })

  test('every entry has required shape including key and category', () => {
    for (const [key, doc] of Object.entries(DICE_DOCS)) {
      checkNotationDocShape(doc, key)
    }
  })

  test('contains all 7 known dice keys', () => {
    expect(DICE_DOCS['xDN']).toBeDefined()
    expect(DICE_DOCS['d%']).toBeDefined()
    expect(DICE_DOCS['dF']).toBeDefined()
    expect(DICE_DOCS['gN']).toBeDefined()
    expect(DICE_DOCS['DDN']).toBeDefined()
    expect(DICE_DOCS['zN']).toBeDefined()
    expect(DICE_DOCS['d{...}']).toBeDefined()
  })

  test('xDN entry has correct title', () => {
    expect(DICE_DOCS['xDN']?.title).toBe('Core Roll')
  })
})

describe('NOTATION_DOCS', () => {
  test('is a non-empty record', () => {
    expect(typeof NOTATION_DOCS).toBe('object')
    expect(Object.keys(NOTATION_DOCS).length).toBeGreaterThan(0)
  })

  test('is a superset of MODIFIER_DOCS and DICE_DOCS', () => {
    for (const key of Object.keys(MODIFIER_DOCS)) {
      expect(NOTATION_DOCS[key]).toBeDefined()
    }
    for (const key of Object.keys(DICE_DOCS)) {
      expect(NOTATION_DOCS[key]).toBeDefined()
    }
  })

  test('total count equals MODIFIER_DOCS + DICE_DOCS', () => {
    expect(Object.keys(NOTATION_DOCS).length).toBe(
      Object.keys(MODIFIER_DOCS).length + Object.keys(DICE_DOCS).length
    )
  })

  test('xDN is in NOTATION_DOCS', () => {
    expect(NOTATION_DOCS['xDN']).toBeDefined()
    expect(NOTATION_DOCS['xDN']?.title).toBe('Core Roll')
  })
})

describe('derivation correctness', () => {
  test('every RANDSUM_MODIFIERS doc maps to same object in MODIFIER_DOCS', () => {
    for (const mod of RANDSUM_MODIFIERS) {
      for (const doc of mod.docs ?? []) {
        expect(MODIFIER_DOCS[doc.key]).toBe(doc)
      }
    }
  })

  test('every RANDSUM_DICE_SCHEMAS doc maps to same object in DICE_DOCS', () => {
    for (const schema of RANDSUM_DICE_SCHEMAS) {
      expect(DICE_DOCS[schema.doc.key]).toBe(schema.doc)
    }
  })

  test('every entry in all three constants has non-empty key and category', () => {
    for (const [, doc] of Object.entries(NOTATION_DOCS)) {
      expect(doc.key.length).toBeGreaterThan(0)
      expect(doc.category.length).toBeGreaterThan(0)
    }
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      expect(doc.key.length).toBeGreaterThan(0)
      expect(doc.category.length).toBeGreaterThan(0)
    }
    for (const [, doc] of Object.entries(DICE_DOCS)) {
      expect(doc.key.length).toBeGreaterThan(0)
      expect(doc.category.length).toBeGreaterThan(0)
    }
  })
})

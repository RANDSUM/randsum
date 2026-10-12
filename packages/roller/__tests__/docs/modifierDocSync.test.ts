import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'
import { MODIFIER_DOCS } from '../../src/docs/modifierDocs'
import { MODIFIER_DOCS_BY_NAME, MODIFIER_NOTATION_DOCS } from '../../src/docs/modifierDocData'
import { MODIFIER_SCHEMAS } from '../../src/notation/definitions'

describe('modifier doc sync', () => {
  test('RANDSUM_MODIFIERS registers exactly 19 modifiers', () => {
    expect(RANDSUM_MODIFIERS.length).toBe(19)
  })

  test('RANDSUM_MODIFIERS follows MODIFIER_SCHEMAS, sorted by priority', () => {
    expect(RANDSUM_MODIFIERS.map(mod => mod.name)).toEqual(MODIFIER_SCHEMAS.map(s => s.name))
    const priorities = MODIFIER_SCHEMAS.map(s => s.priority)
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
  })

  test('the docs list modifiers in MODIFIER_SCHEMAS order, with matching categories', () => {
    expect(Object.keys(MODIFIER_DOCS_BY_NAME)).toEqual(MODIFIER_SCHEMAS.map(s => s.name))
    for (const schema of MODIFIER_SCHEMAS) {
      expect(MODIFIER_DOCS_BY_NAME[schema.name]?.[0]?.category).toBe(schema.category)
    }
  })

  test('every modifier name is unique', () => {
    const names = RANDSUM_MODIFIERS.map(mod => mod.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('every doc surface in MODIFIER_NOTATION_DOCS has a non-empty key', () => {
    for (const doc of MODIFIER_NOTATION_DOCS) {
      expect(typeof doc.key).toBe('string')
      expect(doc.key.length).toBeGreaterThan(0)
    }
  })

  test('MODIFIER_DOCS contains exactly the keys declared in MODIFIER_NOTATION_DOCS', () => {
    const allDocKeys = MODIFIER_NOTATION_DOCS.map(doc => doc.key)
    expect(Object.keys(MODIFIER_DOCS).sort()).toEqual([...allDocKeys].sort())
  })

  test('every doc key is declared exactly once (no duplicates)', () => {
    const allDocKeys = MODIFIER_NOTATION_DOCS.map(doc => doc.key)
    expect(new Set(allDocKeys).size).toBe(allDocKeys.length)
  })

  test('total doc entry count matches expected (29)', () => {
    expect(Object.keys(MODIFIER_DOCS).length).toBe(29)
  })
})

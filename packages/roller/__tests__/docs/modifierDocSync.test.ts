import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'
import { MODIFIER_DOCS } from '../../src/docs/modifierDocs'

describe('modifier doc sync', () => {
  test('every modifier in RANDSUM_MODIFIERS has a non-empty docs array', () => {
    for (const mod of RANDSUM_MODIFIERS) {
      expect(mod.docs).toBeDefined()
      expect(mod.docs!.length).toBeGreaterThan(0)
    }
  })

  test('every key in MODIFIER_DOCS is owned by exactly one modifier in RANDSUM_MODIFIERS', () => {
    const allDocKeys = new Set(
      RANDSUM_MODIFIERS.flatMap(mod => (mod.docs ?? []).map(doc => doc.key))
    )
    for (const key of Object.keys(MODIFIER_DOCS)) {
      expect(allDocKeys.has(key)).toBe(true)
    }
  })

  test('MODIFIER_DOCS contains exactly the keys declared in RANDSUM_MODIFIERS docs', () => {
    const allDocKeys = RANDSUM_MODIFIERS.flatMap(mod => (mod.docs ?? []).map(doc => doc.key))
    expect(Object.keys(MODIFIER_DOCS).sort()).toEqual(allDocKeys.sort())
  })

  test('total doc entry count matches expected (29)', () => {
    expect(Object.keys(MODIFIER_DOCS).length).toBe(29)
  })
})

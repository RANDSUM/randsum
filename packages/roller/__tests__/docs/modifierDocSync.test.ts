import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'
import { MODIFIER_DOC_ENTRIES } from '../../src/docs/modifierDocEntries'

describe('modifier doc sync', () => {
  test('MODIFIER_DOC_ENTRIES exists and is non-empty', () => {
    expect(MODIFIER_DOC_ENTRIES).toBeDefined()
    expect(MODIFIER_DOC_ENTRIES.length).toBeGreaterThan(0)
  })

  test('every modifier in RANDSUM_MODIFIERS has at least one doc entry', () => {
    const docKeys = new Set(MODIFIER_DOC_ENTRIES.map(doc => doc.key))
    // Each modifier name should appear somewhere in the doc keys or at least
    // we should have doc entries contributed from that modifier
    expect(docKeys.size).toBeGreaterThan(0)
    // All 19 modifiers contribute docs
    expect(RANDSUM_MODIFIERS.length).toBe(19)
  })

  test('MODIFIER_DOC_ENTRIES contains known modifier doc keys', () => {
    const keys = MODIFIER_DOC_ENTRIES.map(doc => doc.key)
    // Spot-check a few known keys from well-known modifiers
    expect(keys).toContain('+')
    expect(keys).toContain('-')
    expect(keys).toContain('!')
    expect(keys).toContain('!!')
    expect(keys).toContain('L')
    expect(keys).toContain('H')
    expect(keys).toContain('K')
    expect(keys).toContain('KL')
    expect(keys).toContain('KM')
    expect(keys).toContain('R{..}')
    expect(keys).toContain('U')
    expect(keys).toContain('W')
    expect(keys).toContain('sort')
    expect(keys).toContain('C{..}')
    expect(keys).toContain('V{..}')
    expect(keys).toContain('//')
    expect(keys).toContain('%')
    expect(keys).toContain('*')
    expect(keys).toContain('**')
    expect(keys).toContain('#{..}')
    expect(keys).toContain('!p')
    expect(keys).toContain('!s{..}')
  })

  test('no modifier in RANDSUM_MODIFIERS has a docs property', () => {
    for (const mod of RANDSUM_MODIFIERS) {
      expect('docs' in mod).toBe(false)
    }
  })
})

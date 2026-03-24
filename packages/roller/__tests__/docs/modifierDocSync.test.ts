import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'
import { MODIFIER_DOCS } from '../../src/docs/modifierDocs'

describe('modifier doc sync', () => {
  test('MODIFIER_DOCS exists and is non-empty', () => {
    expect(MODIFIER_DOCS).toBeDefined()
    expect(Object.keys(MODIFIER_DOCS).length).toBeGreaterThan(0)
  })

  test('MODIFIER_DOCS contains known modifier doc keys', () => {
    const keys = Object.keys(MODIFIER_DOCS)
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

  test('NotationDoc entries do not have a displayOptional field', () => {
    for (const [, doc] of Object.entries(MODIFIER_DOCS)) {
      expect('displayOptional' in doc).toBe(false)
    }
  })

  test('RANDSUM_MODIFIERS has 19 modifiers', () => {
    expect(RANDSUM_MODIFIERS.length).toBe(19)
  })
})

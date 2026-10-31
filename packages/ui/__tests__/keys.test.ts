import { describe, expect, test } from 'bun:test'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { isDiceNotation } from '@randsum/roller/validate'
import { CLEAR_KEY, DEFAULT_KEYS, DICE_KEYS, applyKey, modifierKeys } from '../src/keys'
import type { ModifierName } from '../src/keys'
import { MODIFIER_TABLE } from '../src/modifiers'
import { checkNotation } from '../src/core/check'

const NAMES = Object.keys(MODIFIER_TABLE) as ModifierName[]

describe('keys', () => {
  test('the dice keys add d4 through d20 and d%', () => {
    expect(DICE_KEYS.map(k => k.label)).toEqual(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd%'])
    expect(applyKey('', DICE_KEYS[6] ?? CLEAR_KEY)).toBe('1d100')
  })

  test('clear empties the roll', () => {
    expect(applyKey('4d6L+2', CLEAR_KEY)).toBe('')
  })

  test('every default key on the starting roll builds a roll that rolls', () => {
    for (const key of DEFAULT_KEYS) {
      if (key.action.kind === 'clear') continue
      expect(checkNotation(applyKey('1d20', key)).kind).toBe('valid')
    }
  })

  test('every modifier is in the table, as the roller names it', () => {
    expect(NAMES).toHaveLength(19)
  })

  test("every modifier's keys start with the dice keys and roll as tapped", () => {
    for (const name of NAMES) {
      const keys = modifierKeys(name)
      expect(keys.slice(0, DICE_KEYS.length)).toEqual([...DICE_KEYS])
      for (const key of keys) {
        if (key.action.kind === 'clear') continue
        for (const base of ['4d6', '4d6+1']) {
          const built = applyKey(base, key)
          expect(isDiceNotation(built)).toBe(true)
          expect(checkNotation(built).kind).toBe('valid')
        }
      }
    }
  })

  test("every modifier names doc entries the roller's docs have", () => {
    for (const name of NAMES) {
      for (const key of MODIFIER_TABLE[name].docKeys) {
        expect(NOTATION_DOCS[key]).toBeDefined()
      }
    }
  })
})

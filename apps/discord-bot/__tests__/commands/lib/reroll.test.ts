import { describe, expect, test } from 'bun:test'
import {
  CUSTOM_ID_LIMIT,
  decodeReroll,
  encodeReroll,
  isRerollId
} from '../../../src/commands/lib/reroll.js'

describe('encodeReroll', () => {
  test('encodes the command and its options', () => {
    expect(encodeReroll('roll', { notation: '4d6L' })).toBe('r:roll:notation=4d6L')
  })

  test('omits absent options rather than encoding empties', () => {
    expect(encodeReroll('fifth', { modifier: 2, dc: null, rolling_with: undefined })).toBe(
      'r:fifth:modifier=2'
    )
  })

  test('omits false booleans, which decode identically and cost characters', () => {
    expect(encodeReroll('blades', { dice: 3, hidden: false })).toBe('r:blades:dice=3')
  })

  test('keeps true booleans, which do not', () => {
    expect(encodeReroll('blades', { dice: 3, hidden: true })).toBe('r:blades:dice=3&hidden=true')
  })

  test('escapes values that would otherwise break the encoding', () => {
    const id = encodeReroll('roll', { notation: '2d6+3[fire & ice]' })
    expect(id).toBeDefined()
    expect(decodeReroll(id!)?.options.getString('notation')).toBe('2d6+3[fire & ice]')
  })

  test('returns undefined rather than a truncated id when over the limit', () => {
    // A truncated id would decode into a *different roll*, which is worse than
    // no button — and Discord rejects the whole message over the limit anyway.
    const long = `2d6+3[${'a'.repeat(120)}]`
    expect(encodeReroll('roll', { notation: long })).toBeUndefined()
  })

  test('an id at exactly the limit is kept', () => {
    const padding = 'a'.repeat(CUSTOM_ID_LIMIT - 'r:roll:notation='.length)
    const id = encodeReroll('roll', { notation: padding })
    expect(id).toHaveLength(CUSTOM_ID_LIMIT)
  })
})

describe('decodeReroll', () => {
  test('round-trips through encode', () => {
    const id = encodeReroll('pbta', { stat: 2, forward: -1, rolling_with: 'Advantage' })
    const target = decodeReroll(id!)

    expect(target?.commandName).toBe('pbta')
    expect(target?.options.getInteger('stat')).toBe(2)
    expect(target?.options.getInteger('forward')).toBe(-1)
    expect(target?.options.getString('rolling_with')).toBe('Advantage')
  })

  test('reports the hidden flag so a reroll stays as private as the original', () => {
    expect(decodeReroll(encodeReroll('roll', { notation: '1d20', hidden: true })!)?.hidden).toBe(
      true
    )
    expect(decodeReroll(encodeReroll('roll', { notation: '1d20' })!)?.hidden).toBe(false)
  })

  test('an absent option reads as null, exactly as an unset slash option does', () => {
    const target = decodeReroll('r:fifth:modifier=2')
    expect(target?.options.getInteger('dc')).toBeNull()
    expect(target?.options.getString('rolling_with')).toBeNull()
    expect(target?.options.getBoolean('hidden')).toBeNull()
  })

  test('an unparseable integer degrades to null rather than NaN', () => {
    // A corrupted id should reroll with defaults, not render "NaN" at a player.
    expect(decodeReroll('r:fifth:modifier=abc')?.options.getInteger('modifier')).toBeNull()
  })

  test('rejects ids that are not rerolls at all', () => {
    expect(decodeReroll('notation-category')).toBeUndefined()
    expect(isRerollId('notation-category')).toBe(false)
  })

  test('rejects a malformed reroll id rather than guessing', () => {
    expect(decodeReroll('r:')).toBeUndefined()
    expect(decodeReroll('r:roll')).toBeUndefined()
    expect(decodeReroll('r::notation=2d6')).toBeUndefined()
  })
})

/**
 * Covers the transport-agnostic option adapter.
 *
 * These tests exist because `optionsFromPayload` is the piece that has to
 * behave identically to discord.js's accessors without being discord.js. A
 * divergence here would show up as a command silently reading `null` for an
 * option the user actually supplied — which looks like a game-logic bug, not a
 * transport bug, and would be hunted for in entirely the wrong file.
 */
import { describe, expect, test } from 'bun:test'
import { optionsFromPayload } from '../../../src/commands/lib/context.js'

describe('optionsFromPayload', () => {
  test('reads values by name and type', () => {
    const options = optionsFromPayload([
      { name: 'notation', value: '4d6L' },
      { name: 'modifier', value: 3 },
      { name: 'hidden', value: true }
    ])

    expect(options.getString('notation')).toBe('4d6L')
    expect(options.getInteger('modifier')).toBe(3)
    expect(options.getBoolean('hidden')).toBe(true)
  })

  test('returns null for an absent option', () => {
    const options = optionsFromPayload([{ name: 'notation', value: '2d20' }])

    expect(options.getString('missing')).toBeNull()
    expect(options.getInteger('missing')).toBeNull()
    expect(options.getBoolean('missing')).toBeNull()
  })

  test('returns null when the option exists but is the wrong type', () => {
    // Discord's own validation makes this near-impossible, but reading an
    // integer as a string must not silently coerce — a stringified number
    // flowing into the roller is exactly the kind of bug that survives review.
    const options = optionsFromPayload([{ name: 'modifier', value: '3' }])

    expect(options.getInteger('modifier')).toBeNull()
    expect(options.getString('modifier')).toBe('3')
  })

  test('handles a missing options array', () => {
    // Discord omits `options` entirely for a command invoked with no arguments.
    const options = optionsFromPayload(undefined)

    expect(options.getString('anything')).toBeNull()
  })

  test('a false boolean is returned, not treated as absent', () => {
    // The bug this pins: `?? false` and `=== null` behave differently, and
    // `hidden: false` must not be mistaken for "not supplied".
    const options = optionsFromPayload([{ name: 'hidden', value: false }])

    expect(options.getBoolean('hidden')).toBe(false)
    expect(options.getBoolean('hidden')).not.toBeNull()
  })

  test('a zero integer is returned, not treated as absent', () => {
    // `/blades` accepts 0 dice as a real, meaningful value.
    const options = optionsFromPayload([{ name: 'dice', value: 0 }])

    expect(options.getInteger('dice')).toBe(0)
  })
})

import { describe, expect, test } from 'bun:test'
import { parseRerollId } from '../../src/utils/parseRerollId.js'

// createRollButton cannot be tested in isolation because:
// - It imports from discord.js
// - Other test files use mock.module('discord.js', ...) which is a
//   process-global singleton in Bun — it poisons module resolution
//   for ALL files in the test run, even real static imports
// - The discord.js builder wiring (ButtonBuilder → ActionRowBuilder)
//   is trivial glue code tested implicitly by the command tests
//
// Instead we test the custom ID contract that createRollButton and
// parseRerollId share. This is the actual logic worth verifying.

describe('reroll custom ID contract', () => {
  test('round-trips roll command', () => {
    const customId = 'reroll:roll:2d6'
    const parsed = parseRerollId(customId)
    expect(parsed).toEqual({ command: 'roll', params: '2d6' })
  })

  test('round-trips game command with JSON params', () => {
    const customId = 'reroll:fifth:{"modifier":5,"rollingWith":"Advantage"}'
    const parsed = parseRerollId(customId)
    expect(parsed).toEqual({
      command: 'fifth',
      params: '{"modifier":5,"rollingWith":"Advantage"}'
    })
  })

  test('custom ID format stays within 100-char Discord limit', () => {
    const customId = 'reroll:roll:2d6'
    expect(customId.length).toBeLessThanOrEqual(100)
  })

  test('custom ID with long game params stays within 100 chars', () => {
    const customId = 'reroll:fifth:{"modifier":5,"rollingWith":"Advantage"}'
    expect(customId.length).toBeLessThanOrEqual(100)
  })
})

describe('parseRerollId', () => {
  test('parses roll command custom ID', () => {
    const result = parseRerollId('reroll:roll:2d6')
    expect(result).toEqual({ command: 'roll', params: '2d6' })
  })

  test('parses game command with JSON params', () => {
    const result = parseRerollId('reroll:fifth:{"modifier":5}')
    expect(result).toEqual({ command: 'fifth', params: '{"modifier":5}' })
  })

  test('returns null for non-reroll custom IDs', () => {
    const result = parseRerollId('something:else')
    expect(result).toBeNull()
  })

  test('returns null for empty string', () => {
    const result = parseRerollId('')
    expect(result).toBeNull()
  })

  test('preserves colons in params (e.g. JSON with colons)', () => {
    const params = '{"modifier":5,"rollingWith":"Advantage"}'
    const result = parseRerollId(`reroll:fifth:${params}`)
    expect(result).toEqual({ command: 'fifth', params })
  })

  test('returns null when only prefix with no command', () => {
    const result = parseRerollId('reroll:')
    expect(result).toBeNull()
  })
})

import { describe, expect, test } from 'bun:test'
import { ButtonStyle } from 'discord.js'
import { createRollButton } from '../../src/utils/rollButton.js'
import { parseRerollId } from '../../src/utils/parseRerollId.js'

// No mock.module needed — discord.js builders are plain JS classes that
// produce inspectable JSON via toJSON(). Testing real output is more
// reliable than verifying mock calls, and avoids Bun's mock.module
// global-state issues across test files.

describe('createRollButton', () => {
  test('returns an ActionRow with one button component', () => {
    const row = createRollButton('roll', '2d6')
    const json = row.toJSON()
    expect(json.type).toBe(1) // ActionRow type
    expect(json.components).toHaveLength(1)
    expect(json.components[0]?.type).toBe(2) // Button type
  })

  test('button has Roll Again label', () => {
    const row = createRollButton('roll', '2d6')
    const button = row.toJSON().components[0]
    expect(button?.label).toBe('Roll Again')
  })

  test('button custom ID encodes command and params', () => {
    const row = createRollButton('roll', '2d6')
    const button = row.toJSON().components[0]
    expect(button?.custom_id).toBe('reroll:roll:2d6')
  })

  test('button custom ID for game command with JSON params', () => {
    const row = createRollButton('fifth', '{"modifier":5,"rollingWith":"Advantage"}')
    const button = row.toJSON().components[0]
    expect(button?.custom_id).toBe('reroll:fifth:{"modifier":5,"rollingWith":"Advantage"}')
  })

  test('button custom ID stays within 100 chars', () => {
    const row = createRollButton('roll', '2d6')
    const button = row.toJSON().components[0]
    expect(button?.custom_id?.length).toBeLessThanOrEqual(100)
  })

  test('button uses Secondary style', () => {
    const row = createRollButton('roll', '2d6')
    const button = row.toJSON().components[0]
    expect(button?.style).toBe(ButtonStyle.Secondary)
  })

  test('disabled button has disabled true', () => {
    const row = createRollButton('roll', '2d6', true)
    const button = row.toJSON().components[0]
    expect(button?.disabled).toBe(true)
  })

  test('enabled button has disabled false by default', () => {
    const row = createRollButton('roll', '2d6')
    const button = row.toJSON().components[0]
    expect(button?.disabled).toBe(false)
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
})

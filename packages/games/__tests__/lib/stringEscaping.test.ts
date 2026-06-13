import { describe, expect, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import { escapeSingleQuoted, escapeTemplate } from '../../src/lib/codegen/emitHelpers'
import { compileSpec } from './helpers/compileSpec'
import type { RandSumSpec } from '../../src/lib/types'

/**
 * Author-supplied strings (result labels, descriptions, enum values, error templates) are
 * interpolated into generated TypeScript string literals. They must be escaped so a quote,
 * backslash, or newline cannot break — or inject into — the emitted module.
 */

describe('escape helpers', () => {
  test('escapeSingleQuoted neutralizes quotes, backslashes, and newlines', () => {
    expect(escapeSingleQuoted("it's")).toBe("it\\'s")
    expect(escapeSingleQuoted('a\\b')).toBe('a\\\\b')
    expect(escapeSingleQuoted('a\nb')).toBe('a\\nb')
    expect(escapeSingleQuoted('a\rb')).toBe('a\\rb')
  })

  test('escapeTemplate neutralizes backticks and interpolation starts', () => {
    expect(escapeTemplate('a`b')).toBe('a\\`b')
    expect(escapeTemplate('a${x}b')).toBe('a\\${x}b')
    expect(escapeTemplate('a\\b')).toBe('a\\\\b')
  })
})

const trickyLabelSpec: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Tricky Label Test',
  shortcode: 'trickytest',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 1 },
    resolve: 'sum',
    outcome: {
      ranges: [
        { min: 4, max: 6, result: "Sa'id \\ done" },
        { min: 1, max: 3, result: 'plain' }
      ]
    }
  }
}

describe('result labels needing escaping', () => {
  test('codegen emits the label as a properly escaped string literal', async () => {
    const code = await generateCode(trickyLabelSpec)
    // The raw apostrophe/backslash must be escaped in the emitted source.
    expect(code).toContain("Sa\\'id \\\\ done")
    // And it must NOT appear unescaped (which would terminate the string literal early).
    expect(code).not.toContain("'Sa'id")
  })

  test('compiled roll returns the original (unescaped) label at runtime', async () => {
    const game = await compileSpec(trickyLabelSpec)
    const results = new Set<string>()
    Array.from({ length: 200 }).forEach(() => {
      results.add(String(game['roll']!().result))
    })
    // Every emitted result is a valid known label — proving the generated module both
    // compiled and produced the correct runtime string.
    results.forEach(r => {
      expect(["Sa'id \\ done", 'plain']).toContain(r)
    })
    expect(results.has("Sa'id \\ done")).toBe(true)
  })
})

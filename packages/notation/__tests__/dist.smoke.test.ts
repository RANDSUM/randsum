/**
 * Dist smoke test for @randsum/notation
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/notation build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/notation (dist)', () => {
  test('main entry exports core functions', async () => {
    const mod = await import('../../notation/dist/index.js')
    expect(typeof mod.isDiceNotation).toBe('function')
    expect(typeof mod.notationToOptions).toBe('function')
    expect(typeof mod.optionsToNotation).toBe('function')
    expect(typeof mod.validateNotation).toBe('function')
    expect(typeof mod.tokenize).toBe('function')
  })

  test('isDiceNotation works from dist', async () => {
    const { isDiceNotation } = await import('../../notation/dist/index.js')
    expect(isDiceNotation('4d6')).toBe(true)
    expect(isDiceNotation('not dice')).toBe(false)
  })

  test('notationToOptions parses notation from dist', async () => {
    const { notationToOptions } = await import('../../notation/dist/index.js')
    const options = notationToOptions('4d6L')
    expect(Array.isArray(options)).toBe(true)
    expect(options.length).toBeGreaterThan(0)
  })

  test('tokenize returns tokens from dist', async () => {
    const { tokenize } = await import('../../notation/dist/index.js')
    const tokens = tokenize('4d6L+2')
    expect(Array.isArray(tokens)).toBe(true)
    expect(tokens.length).toBeGreaterThan(0)
    const first = tokens[0]
    expect(first).toHaveProperty('text')
    expect(first).toHaveProperty('type')
  })

  test('validateNotation subpath exports work from dist', async () => {
    const mod = await import('../../notation/dist/validateNotation.js')
    expect(typeof mod.validateNotation).toBe('function')
  })

  test('tokenize subpath exports work from dist', async () => {
    const mod = await import('../../notation/dist/tokenize.js')
    expect(typeof mod.tokenize).toBe('function')
  })

  test('comparison subpath exports work from dist', async () => {
    const mod = await import('../../notation/dist/comparison/index.js')
    expect(typeof mod.parseComparisonNotation).toBe('function')
  })
})

/**
 * Dist smoke test for @randsum/roller
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/roller build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/roller (dist)', () => {
  test('main entry exports roll', async () => {
    const mod = await import('../../roller/dist/index.js')
    expect(typeof mod.roll).toBe('function')
  })

  test('roll(20) returns values, total, rolls', async () => {
    const { roll } = await import('../../roller/dist/index.js')
    const result = roll(20)
    expect(result).toHaveProperty('values')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('rolls')
    expect(typeof result.total).toBe('number')
    expect(Array.isArray(result.rolls)).toBe(true)
  })

  test('roll("4d6L") returns values, total, rolls', async () => {
    const { roll } = await import('../../roller/dist/index.js')
    const result = roll('4d6L')
    expect(result).toHaveProperty('values')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('rolls')
  })

  test('validate subpath exports validateNotation and isDiceNotation', async () => {
    const mod = await import('../../roller/dist/validate.js')
    expect(typeof mod.validateNotation).toBe('function')
    expect(typeof mod.isDiceNotation).toBe('function')
    expect(mod.isDiceNotation('2d6')).toBe(true)
    expect(mod.isDiceNotation('not dice')).toBe(false)
  })

  test('errors subpath exports error classes', async () => {
    const mod = await import('../../roller/dist/errors.js')
    expect(typeof mod.ValidationError).toBe('function')
    expect(typeof mod.ModifierError).toBe('function')
  })
})

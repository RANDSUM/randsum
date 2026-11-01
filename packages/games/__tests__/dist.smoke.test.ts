/**
 * Dist smoke test for @randsum/games
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/games build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/games (dist)', () => {
  test('root dist entry exports AVAILABLE_GAMES and SchemaError', async () => {
    const mod = await import('../../games/dist/index.js')
    expect(mod.AVAILABLE_GAMES).toContain('blades')
    expect(mod.AVAILABLE_GAMES).toHaveLength(7)
    expect(typeof mod.SchemaError).toBe('function')
  })

  test('schema dist entry exports a working codegen toolkit', async () => {
    const mod = await import('../../games/dist/schema.js')
    expect(typeof mod.generateCode).toBe('function')
    expect(typeof mod.lookupByRange).toBe('function')
    expect(typeof mod.resolveExternalRefs).toBe('function')
    expect(mod.validateSpec({}).valid).toBe(false)
    expect(mod.specToFilename('D&D 5th Edition')).toBe('dd-5th-edition')
    const err = new mod.SchemaError('test message', 'INVALID_SPEC')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('test message')
  })

  test('blades dist entry exports roll', async () => {
    const mod = await import('../../games/dist/blades.generated.js')
    expect(typeof mod.roll).toBe('function')
    const result = mod.roll({ rating: 2 })
    expect(result).toHaveProperty('result')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('rolls')
  })

  test('fifth dist entry exports roll', async () => {
    const mod = await import('../../games/dist/fifth.generated.js')
    expect(typeof mod.roll).toBe('function')
    const result = mod.roll({ modifier: 3 })
    expect(result).toHaveProperty('result')
    expect(result).toHaveProperty('total')
  })

  test('salvageunion dist entry exports roll', async () => {
    const mod = await import('../../games/dist/salvageunion.generated.js')
    expect(typeof mod.roll).toBe('function')
    const result = mod.roll('Core Mechanic')
    expect(result).toHaveProperty('result')
    expect(result).toHaveProperty('total')
  })
})

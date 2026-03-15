/**
 * Dist smoke test for @randsum/games
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/games build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/games (dist)', () => {
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

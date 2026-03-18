/**
 * Dist smoke test for @randsum/component-library
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/component-library build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/component-library (dist)', () => {
  test('exports NotationRoller', async () => {
    const mod = await import('../../component-library/dist/index.js')
    expect(typeof mod.NotationRoller).toBe('function')
  })

  test('does NOT export RollerPlayground', async () => {
    const mod = await import('../../component-library/dist/index.js')
    expect(mod.RollerPlayground).toBeUndefined()
  })

  test('does NOT export ModifierReference', async () => {
    const mod = await import('../../component-library/dist/index.js')
    expect(mod.ModifierReference).toBeUndefined()
  })

  test('does NOT export Overlay', async () => {
    const mod = await import('../../component-library/dist/index.js')
    expect(mod.Overlay).toBeUndefined()
  })

  test('exports ErrorBoundary', async () => {
    const mod = await import('../../component-library/dist/index.js')
    expect(typeof mod.ErrorBoundary).toBe('function')
  })
})

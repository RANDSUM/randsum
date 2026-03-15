/**
 * Dist smoke test for @randsum/display-utils
 * Imports from built dist output to verify published package works.
 * Run `bun run --filter @randsum/display-utils build` before this test.
 */
import { describe, expect, test } from 'bun:test'

describe('@randsum/display-utils (dist)', () => {
  test('main entry exports core functions', async () => {
    const mod = await import('../../display-utils/dist/index.js')
    expect(typeof mod.computeSteps).toBe('function')
    expect(typeof mod.MODIFIER_DOCS).toBe('object')
    expect(typeof mod.buildStackBlitzProject).toBe('function')
  })

  test('MODIFIER_DOCS has entries', async () => {
    const { MODIFIER_DOCS } = await import('../../display-utils/dist/index.js')
    const keys = Object.keys(MODIFIER_DOCS)
    expect(keys.length).toBeGreaterThan(0)
  })

  test('buildStackBlitzProject returns project object', async () => {
    const { buildStackBlitzProject } = await import('../../display-utils/dist/index.js')
    const project = buildStackBlitzProject('2d6')
    expect(project).toHaveProperty('title')
    expect(project).toHaveProperty('files')
  })
})

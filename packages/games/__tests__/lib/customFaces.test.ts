import { describe, expect, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import { compileSpec } from './helpers/compileSpec'
import type { RandSumSpec } from '../../src/lib/types'

/**
 * Custom die faces: a pool may declare `faces` instead of `sides`. Numeric faces (e.g. a
 * Fate/Fudge die `[-1, 0, 1]`) roll and sum as their values and feed outcome ranges; string
 * faces (a "table die") use `resolve: 'faces'` and resolve to the rolled label.
 */

const fateSpec: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Fate Test',
  shortcode: 'fatetest',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { faces: [-1, 0, 1] }, quantity: 4 },
    resolve: 'sum',
    outcome: {
      ranges: [
        { min: 3, max: 4, result: 'legendary' },
        { min: 0, max: 2, result: 'good' },
        { min: -4, max: -1, result: 'bad' }
      ]
    }
  }
}

describe('custom faces: numeric (Fate-style)', () => {
  test('codegen emits d{...} notation for a faces pool', async () => {
    const code = await generateCode(fateSpec)
    expect(code).toContain('d{-1,0,1}')
    expect(code).not.toContain('sides:')
  })

  test('rolls sum face values and classify via outcome ranges', async () => {
    const game = await compileSpec(fateSpec)
    Array.from({ length: 200 }).forEach(() => {
      const r = game['roll']!()
      expect(r.total).toBeGreaterThanOrEqual(-4)
      expect(r.total).toBeLessThanOrEqual(4)
      expect(['legendary', 'good', 'bad']).toContain(String(r.result))
    })
  })
})

const tableDieSpec: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Table Die Test',
  shortcode: 'tabletest',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { faces: ['hit', 'miss', 'crit'] }, quantity: 1 },
    resolve: 'faces'
  }
}

describe('custom faces: string (table die)', () => {
  test('codegen emits d{...} notation and a face-label result union', async () => {
    const code = await generateCode(tableDieSpec)
    expect(code).toContain('d{hit,miss,crit}')
    expect(code).toContain("export type TabletestRollResult = 'crit' | 'hit' | 'miss'")
    expect(code).toContain('customResults')
  })

  test('resolves to the rolled face label', async () => {
    const game = await compileSpec(tableDieSpec)
    Array.from({ length: 100 }).forEach(() => {
      const r = game['roll']!()
      expect(['hit', 'miss', 'crit']).toContain(String(r.result))
    })
  })
})

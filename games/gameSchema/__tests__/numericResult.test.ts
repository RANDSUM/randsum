import { describe, expect, test } from 'bun:test'
import { generateCode, loadSpec } from '../src'

const NUMERIC_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Numeric Test',
  shortcode: 'test-num',
  game_url: 'https://example.com',
  roll: {
    inputs: { modifier: { type: 'integer' as const, default: 0 } },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: 'sum' as const,
    postResolveModifiers: [{ add: { $input: 'modifier' } }]
    // no outcome field
  }
}

describe('numeric result (no outcome field)', () => {
  test('result is the numeric total, not a string', () => {
    const game = loadSpec(NUMERIC_SPEC)
    const r = game.roll({ modifier: 5 })
    expect(typeof r.result).toBe('number')
    expect(r.result).toBe(r.total)
    expect(r.total).toBeGreaterThanOrEqual(6)
    expect(r.total).toBeLessThanOrEqual(25)
  })

  test('codegen emits number result type for no-outcome roll', () => {
    const code = generateCode(NUMERIC_SPEC)
    expect(code).toContain('RollResult = number')
  })
})

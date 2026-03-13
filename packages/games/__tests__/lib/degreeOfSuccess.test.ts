import { describe, expect, test } from 'bun:test'
import { generateCode, loadSpec, validateSpec } from '../../src/lib'

const DOS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Degree of Success Test',
  shortcode: 'test-dos',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: 'sum' as const,
    outcome: {
      degreeOfSuccess: {
        criticalSuccess: 30,
        success: 20,
        failure: 10,
        criticalFailure: 0
      }
    }
  }
}

describe('degreeOfSuccess schema validation', () => {
  test('spec with degreeOfSuccess outcome is valid', () => {
    const result = validateSpec(DOS_SPEC)
    expect(result.valid).toBe(true)
  })
})

describe('degreeOfSuccess runtime', () => {
  test('result is one of the declared degree names', () => {
    const game = loadSpec(DOS_SPEC)
    const VALID = ['criticalSuccess', 'success', 'failure', 'criticalFailure']
    Array.from({ length: 100 }, () => game.roll()).forEach(r => {
      expect(VALID).toContain(r.result)
    })
  })

  test('criticalFailure is returned for very low totals (1-9)', () => {
    // d20 roll of 1 → criticalFailure (threshold 0)
    const game = loadSpec(DOS_SPEC)
    // Can't force a specific roll, but run enough to see criticalFailure appear
    const results = Array.from({ length: 200 }, () => game.roll()).map(r => r.result)
    expect(results).toContain('criticalFailure')
  })
})

describe('degreeOfSuccess codegen', () => {
  test('generated Result type contains all degree names', async () => {
    const code = await generateCode(DOS_SPEC)
    expect(code).toContain("'criticalSuccess'")
    expect(code).toContain("'success'")
    expect(code).toContain("'failure'")
    expect(code).toContain("'criticalFailure'")
  })

  test('generated Result type is NOT numeric (string union, not number)', async () => {
    const code = await generateCode(DOS_SPEC)
    expect(code).not.toContain('RollResult = number')
    // Should be a string union
    expect(code).toMatch(/RollResult = '[a-zA-Z]/)
  })

  test('generated code emits threshold comparisons in descending order', async () => {
    const code = await generateCode(DOS_SPEC)
    // criticalSuccess threshold (30) should appear before success (20) in the code
    const critIdx = code.indexOf('criticalSuccess')
    const successIdx = code.indexOf("'success'")
    expect(critIdx).toBeLessThan(successIdx)
  })

  test('generated code does not emit No table match error (uses degree fallback)', async () => {
    const code = await generateCode(DOS_SPEC)
    // Should NOT emit range-lookup error, instead returns lowest degree as default
    expect(code).toContain("return { total, result: 'criticalFailure'")
  })
})

import { describe, expect, test } from 'bun:test'

import { generateCode } from '../../src/lib/codegen'
import { compileSpec, expectRejects } from './helpers/compileSpec'
import type { RandSumSpec } from '../../src/lib/types'

function makeSpec(overrides: Partial<RandSumSpec>): RandSumSpec {
  return {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Shape Test',
    shortcode: 'shape',
    game_url: 'https://example.com',
    ...overrides
  }
}

describe('resultShape: numeric', () => {
  const numericSpec = makeSpec({
    roll: {
      dice: { pool: { sides: 6 }, quantity: 2 },
      resolve: 'sum',
      outcome: {
        resultShape: 'numeric',
        ranges: [
          { min: 10, max: 12, result: 'strong' },
          { min: 7, max: 9, result: 'weak' },
          { min: 2, max: 6, result: 'miss' }
        ]
      }
    }
  })

  test('codegen emits numeric result type and returns total as result', async () => {
    const code = await generateCode(numericSpec)
    // Result type is numeric, not a string union.
    expect(code).toContain('export type ShapeRollResult = number')
    // Each matched branch returns `result: total` rather than a label string.
    expect(code).toContain('result: total')
    expect(code).not.toContain("result: 'strong'")
  })

  test('compiled module returns total as numeric result', async () => {
    const game = await compileSpec(numericSpec)
    const result = game['roll']!()
    expect(typeof result.result).toBe('number')
    expect(result.result).toBe(result.total)
  })

  test('numeric range gaps are rejected at compile time (validation preserved)', async () => {
    // Range gap at total 5: codegen's range-coverage check rejects the spec up front,
    // so the gap can never surface as a runtime failure.
    const gappedSpec = makeSpec({
      shortcode: 'gapped',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum',
        outcome: {
          resultShape: 'numeric',
          ranges: [
            { min: 1, max: 4, result: 'low' },
            { min: 6, max: 6, result: 'high' }
          ]
        }
      }
    })
    await expectRejects(compileSpec(gappedSpec), 'missing 5')
  })
})

describe('resultShape: label (default)', () => {
  test('omitting resultShape preserves existing string-label behavior', async () => {
    const spec = makeSpec({
      shortcode: 'labeled',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            { min: 10, max: 12, result: 'strong' },
            { min: 2, max: 9, result: 'other' }
          ]
        }
      }
    })
    const code = await generateCode(spec)
    expect(code).toContain("result: 'strong'")
    expect(code).toContain("result: 'other'")
    expect(code).toContain('LabeledRollResult')
  })
})

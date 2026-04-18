import { describe, expect, test } from 'bun:test'

import { SchemaError } from '../../src/lib/errors'
import { generateCode } from '../../src/lib/codegen'
import type { RandSumSpec } from '../../src/lib/types'

function makeSpec(overrides: Partial<RandSumSpec>): RandSumSpec {
  return {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Coverage Test',
    shortcode: 'cov',
    game_url: 'https://example.com',
    ...overrides
  } as RandSumSpec
}

async function expectThrows(spec: RandSumSpec, messagePattern?: RegExp): Promise<SchemaError> {
  try {
    await generateCode(spec)
  } catch (e) {
    expect(e).toBeInstanceOf(SchemaError)
    if (messagePattern) expect((e as SchemaError).message).toMatch(messagePattern)
    return e as SchemaError
  }
  throw new Error('generateCode did not throw')
}

describe('range coverage validator', () => {
  test('passes when ranges fully cover 2d6 pool', async () => {
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            { min: 10, max: 12, result: 'strong' },
            { min: 7, max: 9, result: 'weak' },
            { min: 2, max: 6, result: 'miss' }
          ]
        }
      }
    })
    const code = await generateCode(spec)
    expect(typeof code).toBe('string')
  })

  test('fails when a middle range is missing', async () => {
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            { min: 10, max: 12, result: 'strong' },
            // gap at 7..9
            { min: 2, max: 6, result: 'miss' }
          ]
        }
      }
    })
    await expectThrows(spec, /7\.\.9/)
  })

  test('fails when top of pool is uncovered', async () => {
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            { min: 2, max: 9, result: 'low' }
            // gap at 10..12
          ]
        }
      }
    })
    await expectThrows(spec, /10\.\.12/)
  })

  test('allows poolCondition-gated ranges to overlap without blocking coverage', async () => {
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            {
              poolCondition: {
                countWhere: { operator: '=', value: 6 },
                atLeast: 2
              },
              result: 'critical'
            },
            { min: 10, max: 12, result: 'strong' },
            { min: 7, max: 9, result: 'weak' },
            { min: 2, max: 6, result: 'miss' }
          ]
        }
      }
    })
    const code = await generateCode(spec)
    expect(typeof code).toBe('string')
  })

  test('skips coverage when resolve is not sum', async () => {
    // countMatching produces a count, not a sum — analyzer can't infer
    // total bounds, so the outcome is not checked.
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 10 }, quantity: 5 },
        resolve: { countMatching: { operator: '>=', value: 7 } },
        outcome: {
          ranges: [{ exact: 99, result: 'anything' }]
        }
      }
    })
    const code = await generateCode(spec)
    expect(typeof code).toBe('string')
  })

  test('accepts and emits min-alone ranges', async () => {
    const spec = makeSpec({
      roll: {
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        outcome: {
          ranges: [
            { min: 7, result: 'success' },
            { max: 6, result: 'failure' }
          ]
        }
      }
    })
    const code = await generateCode(spec)
    expect(code).toContain('total >= 7')
    expect(code).toContain('total <= 6')
  })

  test('accounts for postResolveModifiers shift', async () => {
    const spec = makeSpec({
      roll: {
        inputs: { bonus: { type: 'integer', minimum: 0, maximum: 3 } },
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: 'sum',
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        outcome: {
          ranges: [
            { min: 10, max: 15, result: 'strong' },
            { min: 2, max: 9, result: 'weak' }
          ]
        }
      }
    })
    // Total range is 2..15 (2d6 + 0..3), covered exactly.
    const code = await generateCode(spec)
    expect(typeof code).toBe('string')
  })
})

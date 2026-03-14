import { describe, expect, test } from 'bun:test'
import { normalizeSpec } from '../../src/lib/normalizer'
import type { RandSumSpec } from '../../src/lib/types'

describe('normalizeSpec: countMatching resolve', () => {
  test('normalizes countMatching resolve operation', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'CountMatch Test',
      shortcode: 'test-cm',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 4 },
        resolve: {
          countMatching: { operator: '>=' as const, value: 4 }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(typeof rollDef.resolve).toBe('object')
    expect('countMatching' in rollDef.resolve).toBe(true)
  })
})

describe('normalizeSpec: tableLookup outcome', () => {
  // Covers line 99 - normalizeOutcome tableLookup branch
  test('normalizes inline tableLookup outcome', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'TableLookup Test',
      shortcode: 'test-tl',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum' as const,
        outcome: {
          tableLookup: {
            ranges: [
              { min: 1, max: 3, result: 'low' },
              { min: 4, max: 6, result: 'high' }
            ]
          }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(rollDef.outcome).toBeDefined()
    expect('tableLookup' in rollDef.outcome!).toBe(true)
  })

  test('normalizes tableLookup outcome via $ref', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'TableRef Test',
      shortcode: 'test-tlref',
      game_url: 'https://example.com',
      tables: {
        myTable: {
          ranges: [
            { min: 1, max: 3, result: 'low' },
            { min: 4, max: 6, result: 'high' }
          ]
        }
      },
      roll: {
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum' as const,
        outcome: {
          tableLookup: { $ref: '#/tables/myTable' }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(rollDef.outcome).toBeDefined()
    expect('tableLookup' in rollDef.outcome!).toBe(true)
  })
})

describe('normalizeSpec: comparePoolSum resolve', () => {
  // Covers line 78 of normalizer.ts
  test('normalizes comparePoolSum resolve', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'CompareSum Test',
      shortcode: 'test-cs',
      game_url: 'https://example.com',
      roll: {
        dicePools: {
          a: { pool: { sides: 6 }, quantity: 2 },
          b: { pool: { sides: 6 }, quantity: 2 }
        },
        resolve: {
          comparePoolSum: {
            pools: ['a', 'b'] as readonly [string, string],
            outcomes: { a: 'a_wins', b: 'b_wins' }
          }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(typeof rollDef.resolve).toBe('object')
    expect('comparePoolSum' in rollDef.resolve).toBe(true)
  })
})

describe('normalizeSpec: dice array normalization', () => {
  // Covers line 56 of normalizer.ts (normalizeDice array branch)
  test('normalizes array of dice configs', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Array Dice Test',
      shortcode: 'test-arrdice',
      game_url: 'https://example.com',
      roll: {
        dice: [
          { pool: { sides: 6 }, quantity: 2 },
          { pool: { sides: 8 }, quantity: 1 }
        ],
        resolve: 'sum' as const
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(Array.isArray(rollDef.dice)).toBe(true)
    const dice = rollDef.dice as readonly { pool: { sides: number } }[]
    expect(dice).toHaveLength(2)
    expect(dice[0]!.pool.sides).toBe(6)
    expect(dice[1]!.pool.sides).toBe(8)
  })
})

describe('normalizeSpec: remoteTableLookup resolve', () => {
  test('normalizes remoteTableLookup resolve', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'RTL Norm Test',
      shortcode: 'test-rtlnorm',
      game_url: 'https://example.com',
      roll: {
        inputs: { tableName: { type: 'string' as const } },
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: {
          remoteTableLookup: {
            url: 'https://example.com/tables.json',
            find: { field: 'name', input: 'tableName' },
            tableField: 'table',
            resultMapping: { key: { $lookupResult: 'key' } }
          }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(typeof rollDef.resolve).toBe('object')
    expect('remoteTableLookup' in rollDef.resolve).toBe(true)
  })
})

describe('normalizeSpec: tableLookup resolve', () => {
  // Covers line 78: tableLookup in resolve
  test('normalizes tableLookup in resolve operation', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'TL Resolve Test',
      shortcode: 'test-tlres',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: {
          tableLookup: {
            ranges: [
              { min: 1, max: 3, result: 'low' },
              { min: 4, max: 6, result: 'high' }
            ]
          }
        },
        outcome: {
          ranges: [
            { min: 1, max: 3, result: 'low' },
            { min: 4, max: 6, result: 'high' }
          ]
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(typeof rollDef.resolve).toBe('object')
    expect('tableLookup' in rollDef.resolve).toBe(true)
  })
})

describe('normalizeSpec: degreeOfSuccess outcome normalization', () => {
  test('normalizes degreeOfSuccess outcome', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'DOS Norm Test',
      shortcode: 'test-dosnorm',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: 'sum' as const,
        outcome: {
          degreeOfSuccess: {
            criticalSuccess: 20,
            success: 10,
            failure: 2,
            criticalFailure: 1
          }
        }
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    const rollDef = normalized.rolls['roll']!
    expect(rollDef.outcome).toBeDefined()
    expect('degreeOfSuccess' in rollDef.outcome!).toBe(true)
    const outcome = rollDef.outcome as { degreeOfSuccess: Record<string, number> }
    expect(outcome.degreeOfSuccess.criticalSuccess).toBe(20)
  })
})

describe('normalizeSpec: version and srd_url pass-through', () => {
  test('preserves optional fields', () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Version Test',
      shortcode: 'test-ver',
      version: '1.0.0',
      game_url: 'https://example.com',
      srd_url: 'https://srd.example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum' as const
      }
    } as RandSumSpec
    const normalized = normalizeSpec(spec)
    expect(normalized.version).toBe('1.0.0')
    expect(normalized.srd_url).toBe('https://srd.example.com')
  })
})

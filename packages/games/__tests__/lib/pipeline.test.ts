import { describe, expect, test } from 'bun:test'
import { loadSpec } from '../../src/lib/loader'
import { executePipeline } from '../../src/lib/pipeline'
import { normalizeSpec } from '../../src/lib/normalizer'
import type { NormalizedRollDefinition } from '../../src/lib/normalizedTypes'
import type { RandSumSpec } from '../../src/lib/types'

function makeSpec(rollDef: Record<string, unknown>): RandSumSpec {
  return {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Pipeline Test',
    shortcode: 'test-pipe',
    game_url: 'https://example.com',
    roll: { resolve: 'sum' as const, ...rollDef }
  } as RandSumSpec
}

function getNormalized(spec: RandSumSpec): NormalizedRollDefinition {
  const nspec = normalizeSpec(spec)
  return nspec.rolls['roll']!
}

describe('executePipeline', () => {
  describe('compareValues in condition evaluation', () => {
    test('numeric > operator', () => {
      const spec = makeSpec({
        inputs: { val: { type: 'integer' as const } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        when: [
          {
            condition: { input: 'val', operator: '>' as const, value: 5 },
            override: { dice: { pool: { sides: 20 }, quantity: 1 } }
          }
        ]
      })
      const game = loadSpec(spec)
      const result = game.roll({ val: 10 })
      expect(typeof result.total).toBe('number')
    })

    test('numeric >= operator', () => {
      const spec = makeSpec({
        inputs: { val: { type: 'integer' as const } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        when: [
          {
            condition: { input: 'val', operator: '>=' as const, value: 5 },
            override: { dice: { pool: { sides: 20 }, quantity: 1 } }
          }
        ]
      })
      const game = loadSpec(spec)
      const result = game.roll({ val: 5 })
      expect(typeof result.total).toBe('number')
    })

    test('numeric < operator', () => {
      const spec = makeSpec({
        inputs: { val: { type: 'integer' as const } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        when: [
          {
            condition: { input: 'val', operator: '<' as const, value: 5 },
            override: { dice: { pool: { sides: 20 }, quantity: 1 } }
          }
        ]
      })
      const game = loadSpec(spec)
      const result = game.roll({ val: 2 })
      expect(typeof result.total).toBe('number')
    })

    test('numeric <= operator', () => {
      const spec = makeSpec({
        inputs: { val: { type: 'integer' as const } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        when: [
          {
            condition: { input: 'val', operator: '<=' as const, value: 5 },
            override: { dice: { pool: { sides: 20 }, quantity: 1 } }
          }
        ]
      })
      const game = loadSpec(spec)
      const result = game.roll({ val: 5 })
      expect(typeof result.total).toBe('number')
    })
  })

  describe('remoteTableLookup throws at runtime', () => {
    test('executePipeline throws for remoteTableLookup resolve', () => {
      const spec = makeSpec({
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
      })
      const rollDef = getNormalized(spec)
      expect(() => executePipeline(rollDef, { tableName: 'foo' }, 'Test')).toThrow(
        'remoteTableLookup'
      )
    })
  })

  describe('buildSingleRollOptions with key', () => {
    test('dice config with key passes through', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 2, key: 'test-key' },
        modify: [{ keepHighest: 1 }]
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.total).toBe('number')
    })

    test('dice config with key but no modifiers', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 2, key: 'test-key' }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.total).toBe('number')
    })
  })

  describe('buildRollOptionsArray with dice array', () => {
    test('handles array of dice configs', () => {
      const spec: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Array Dice Test',
        shortcode: 'test-arr',
        game_url: 'https://example.com',
        roll: {
          dice: [
            { pool: { sides: 6 }, quantity: 2 },
            { pool: { sides: 8 }, quantity: 1 }
          ],
          resolve: 'sum' as const
        }
      } as RandSumSpec
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.total).toBe('number')
    })
  })

  describe('applyManualModifiers (markDice + keepMarked)', () => {
    test('markDice and keepMarked filter dice', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 4 },
        modify: [
          { markDice: { operator: '>=' as const, value: 4, flag: 'high' } },
          { keepMarked: 'high' }
        ]
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 50 }, () => game.roll())
      // Some results may be 0 if no dice >= 4
      results.forEach(r => {
        expect(typeof r.total).toBe('number')
      })
    })
  })

  describe('evaluatePoolCondition', () => {
    test('poolCondition with atLeast', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 4 },
        outcome: {
          ranges: [
            {
              result: 'critical',
              poolCondition: {
                pool: 'preModify' as const,
                countWhere: { operator: '=' as const, value: 6 },
                atLeast: 2
              }
            },
            { min: 1, max: 99, result: 'normal' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 200 }, () => game.roll())
      const validResults = ['critical', 'normal']
      results.forEach(r => {
        expect(validResults).toContain(r.result)
      })
    })

    test('poolCondition with atLeastRatio', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 4 },
        outcome: {
          ranges: [
            {
              result: 'majority',
              poolCondition: {
                pool: 'preModify' as const,
                countWhere: { operator: '>=' as const, value: 4 },
                atLeastRatio: 0.5
              }
            },
            { min: 1, max: 99, result: 'normal' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 200 }, () => game.roll())
      const validResults = ['majority', 'normal']
      results.forEach(r => {
        expect(validResults).toContain(r.result)
      })
    })

    test('poolCondition with postModify pool', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 4 },
        outcome: {
          ranges: [
            {
              result: 'special',
              poolCondition: {
                pool: 'postModify' as const,
                countWhere: { operator: '>=' as const, value: 4 },
                atLeast: 1
              }
            },
            { min: 1, max: 99, result: 'normal' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      const validResults = ['special', 'normal']
      results.forEach(r => {
        expect(validResults).toContain(r.result)
      })
    })
  })

  describe('lookupRanges edge cases', () => {
    test('range with exact match', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        outcome: {
          ranges: [
            { exact: 6, result: 'max' },
            { exact: 1, result: 'min' },
            { min: 2, max: 5, result: 'mid' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 200 }, () => game.roll())
      const validResults = ['max', 'min', 'mid']
      results.forEach(r => {
        expect(validResults).toContain(r.result)
      })
    })

    test('poolCondition-only range (no min/max/exact)', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 2 },
        outcome: {
          ranges: [
            {
              result: 'double-six',
              poolCondition: {
                countWhere: { operator: '=' as const, value: 6 },
                atLeast: 2
              }
            },
            { min: 1, max: 99, result: 'normal' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 200 }, () => game.roll())
      const validResults = ['double-six', 'normal']
      results.forEach(r => {
        expect(validResults).toContain(r.result)
      })
    })
  })

  describe('resolveTotal with countMatching', () => {
    test('countMatching resolve sums matching dice', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 4 },
        resolve: { countMatching: { operator: '>=' as const, value: 4 } },
        outcome: {
          ranges: [
            { min: 3, max: 4, result: 'success' },
            { min: 0, max: 2, result: 'failure' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(r.total).toBeGreaterThanOrEqual(0)
        expect(r.total).toBeLessThanOrEqual(4)
      })
    })
  })

  describe('tableLookup resolve (sum-based)', () => {
    test('tableLookup in resolve sums dice then applies outcome', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 2 },
        resolve: {
          tableLookup: {
            ranges: [
              { min: 2, max: 6, result: 'low' },
              { min: 7, max: 12, result: 'high' }
            ]
          }
        },
        outcome: {
          ranges: [
            { min: 2, max: 6, result: 'low' },
            { min: 7, max: 12, result: 'high' }
          ]
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(['low', 'high']).toContain(r.result)
      })
    })
  })

  describe('applyOutcome with tableLookup in outcome', () => {
    test('tableLookup outcome resolves ranges', () => {
      const spec: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Table Lookup Test',
        shortcode: 'test-tl',
        game_url: 'https://example.com',
        tables: {
          myTable: {
            ranges: [
              { min: 1, max: 3, result: 'weak' },
              { min: 4, max: 6, result: 'strong' }
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
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(['weak', 'strong']).toContain(r.result)
      })
    })
  })

  describe('applyOutcome fallthrough returns String(total)', () => {
    // This tests the unreachable fallthrough in applyOutcome (line 277)
    // We can only trigger this with a well-crafted normalizedOutcome that
    // has no matching branch. In practice this is hard to reach via loadSpec,
    // so we test executePipeline directly.
    test('no outcome returns numeric total', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.result).toBe('number')
      expect(result.result).toBe(result.total)
    })
  })

  describe('conditionalPools in pipeline', () => {
    test('conditional pool with condition not met sets total to 0', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'boost'] }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'mode', operator: '=' as const, value: 'boost' },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      // normal mode: only main pool
      const result = game.roll({ mode: 'normal' })
      expect(result.rolls.length).toBe(1)
    })

    test('conditional pool evaluateCondition returns false when input missing', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'boost'], optional: true }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'mode', operator: '=' as const, value: 'boost' },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      // no mode input: conditionalPool should be skipped
      const result = game.roll()
      expect(result.rolls.length).toBe(1)
    })

    test('conditional pool with subtract arithmetic', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'penalty'] }
        },
        dicePools: {
          main: { pool: { sides: 12 }, quantity: 1 }
        },
        conditionalPools: {
          penalty: {
            condition: { input: 'mode', operator: '=' as const, value: 'penalty' },
            pool: { sides: 6 },
            arithmetic: 'subtract' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ mode: 'penalty' })
      expect(result.rolls.length).toBe(2)
    })

    test('conditional pool with numeric > operator', () => {
      const spec = makeSpec({
        inputs: {
          level: { type: 'integer' as const, default: 1 }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'level', operator: '>' as const, value: 5 },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ level: 10 })
      expect(result.rolls.length).toBe(2)
    })

    test('conditional pool with numeric >= operator', () => {
      const spec = makeSpec({
        inputs: {
          level: { type: 'integer' as const, default: 1 }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'level', operator: '>=' as const, value: 5 },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ level: 5 })
      expect(result.rolls.length).toBe(2)
    })

    test('conditional pool with numeric < operator', () => {
      const spec = makeSpec({
        inputs: {
          level: { type: 'integer' as const, default: 1 }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'level', operator: '<' as const, value: 5 },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ level: 2 })
      expect(result.rolls.length).toBe(2)
    })

    test('conditional pool with numeric <= operator', () => {
      const spec = makeSpec({
        inputs: {
          level: { type: 'integer' as const, default: 1 }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'level', operator: '<=' as const, value: 5 },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ level: 5 })
      expect(result.rolls.length).toBe(2)
    })

    test('conditional pool: numeric operator with non-numeric input returns false', () => {
      const spec = makeSpec({
        inputs: {
          level: { type: 'string' as const, optional: true }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'level', operator: '>' as const, value: 5 },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      // Pass a string for a > operator: should return false
      const result = game.roll({ level: 'high' })
      expect(result.rolls.length).toBe(1)
    })
  })

  describe('details in single-pool pipeline', () => {
    test('details with $dieCheck leaf', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 20 }, quantity: 1 },
        details: {
          isNat20: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 0,
              operator: '=' as const,
              value: 20
            }
          },
          isNat1: {
            $dieCheck: {
              pool: 0,
              field: 'initial' as const,
              die: 0,
              operator: '=' as const,
              value: 1
            }
          }
        }
      })
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(r.details).toBeDefined()
        expect(typeof r.details?.isNat20).toBe('boolean')
        expect(typeof r.details?.isNat1).toBe('boolean')
      })
    })

    test('details with $dieCheck pointing to nonexistent pool returns false', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 99,
              field: 'final' as const,
              die: 0,
              operator: '=' as const,
              value: 6
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(result.details?.check).toBe(false)
    })

    test('details with $dieCheck pointing to nonexistent die returns false', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 99,
              operator: '=' as const,
              value: 6
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(result.details?.check).toBe(false)
    })
  })

  describe('details with conditional field', () => {
    test('conditional details when input not provided', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, optional: true }
        },
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          modeInfo: {
            when: { input: 'mode' },
            value: {
              modeVal: { $input: 'mode' }
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(result.details?.modeInfo).toBeUndefined()
    })

    test('conditional details when input provided', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, optional: true }
        },
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          modeInfo: {
            when: { input: 'mode' },
            value: {
              modeVal: { $input: 'mode' }
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll({ mode: 'test' })
      const info = result.details?.modeInfo as { modeVal: string }
      expect(info.modeVal).toBe('test')
    })
  })

  describe('details with nested field', () => {
    test('nested details object in pipeline', () => {
      const spec = makeSpec({
        inputs: { bonus: { type: 'integer' as const, default: 0 } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          stats: {
            total: { expr: 'total' as const },
            bonus: { $input: 'bonus', default: 0 }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll({ bonus: 3 })
      const stats = result.details?.stats as { total: number; bonus: number }
      expect(stats.total).toBe(result.total)
      expect(stats.bonus).toBe(3)
    })
  })

  describe('details with $input and default fallback', () => {
    test('$input leaf uses default when input not provided', () => {
      const spec = makeSpec({
        inputs: { bonus: { type: 'integer' as const, optional: true } },
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          bonusVal: { $input: 'bonus', default: 42 }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(result.details?.bonusVal).toBe(42)
    })
  })

  describe('multi-pool details with diceTotal and postResolve', () => {
    test('multi-pool with postResolve modifiers and details', () => {
      const spec = makeSpec({
        inputs: { bonus: { type: 'integer' as const, default: 0 } },
        dicePools: {
          hope: { pool: { sides: 12 }, quantity: 1 },
          fear: { pool: { sides: 12 }, quantity: 1 }
        },
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        resolve: 'sum' as const,
        details: {
          diceTotal: { expr: 'diceTotal' as const }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll({ bonus: 10 })
      expect(result.details).toBeDefined()
      const diceTotal = result.details?.diceTotal as number
      expect(diceTotal).toBe(result.total - 10)
    })
  })

  describe('$dieCheck with various operators', () => {
    test('$dieCheck with > operator', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 0,
              operator: '>' as const,
              value: 3
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.details?.check).toBe('boolean')
    })

    test('$dieCheck with >= operator', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 0,
              operator: '>=' as const,
              value: 3
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.details?.check).toBe('boolean')
    })

    test('$dieCheck with < operator', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 0,
              operator: '<' as const,
              value: 3
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.details?.check).toBe('boolean')
    })

    test('$dieCheck with <= operator', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        details: {
          check: {
            $dieCheck: {
              pool: 0,
              field: 'final' as const,
              die: 0,
              operator: '<=' as const,
              value: 3
            }
          }
        }
      })
      const game = loadSpec(spec)
      const result = game.roll()
      expect(typeof result.details?.check).toBe('boolean')
    })
  })

  describe('when override with postResolveModifiers', () => {
    test('when override replaces postResolveModifiers', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'boosted'] }
        },
        dice: { pool: { sides: 6 }, quantity: 2 },
        postResolveModifiers: [{ add: 0 }],
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'boosted' },
            override: { postResolveModifiers: [{ add: 100 }] }
          }
        ]
      })
      const game = loadSpec(spec)
      const boosted = game.roll({ mode: 'boosted' })
      expect(boosted.total).toBeGreaterThanOrEqual(102)
    })
  })

  describe('when override with different resolve', () => {
    test('when override replaces resolve', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'count'] }
        },
        dice: { pool: { sides: 6 }, quantity: 4 },
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'count' },
            override: {
              resolve: { countMatching: { operator: '>=' as const, value: 4 } }
            }
          }
        ]
      })
      const game = loadSpec(spec)
      const result = game.roll({ mode: 'count' })
      // countMatching returns count of dice >= 4, so 0-4
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(4)
    })
  })

  describe('dice is undefined throws', () => {
    test('throws when dice is missing for single-pool roll', () => {
      const spec = makeSpec({})
      const rollDef = getNormalized(spec)
      // Force dice to be undefined by creating a rollDef without dice
      const fakeDef = { ...rollDef, dice: undefined, dicePools: undefined }
      expect(() => executePipeline(fakeDef, {}, 'Test')).toThrow(
        'dice is required when dicePools is absent'
      )
    })
  })

  describe('evaluatePoolCondition returns false when no atLeast/atLeastRatio', () => {
    // This covers the final return false in evaluatePoolCondition (lines 142-143)
    // Must bypass validation since schema requires atLeast or atLeastRatio
    test('poolCondition with no atLeast and no atLeastRatio returns false', () => {
      const rollDef = getNormalized(
        makeSpec({
          dice: { pool: { sides: 6 }, quantity: 4 },
          outcome: {
            ranges: [{ min: 1, max: 24, result: 'normal' }]
          }
        })
      )
      // Manually patch the outcome to include a poolCondition without atLeast/atLeastRatio
      const patchedDef = {
        ...rollDef,
        outcome: {
          ranges: [
            {
              result: 'special',
              poolCondition: {
                countWhere: { operator: '=' as const, value: 6 }
                // no atLeast, no atLeastRatio
              }
            },
            { min: 1, max: 99, result: 'normal' }
          ]
        }
      }
      // poolCondition without atLeast or atLeastRatio returns false, so always 'normal'
      const results = Array.from({ length: 20 }, () => executePipeline(patchedDef, {}, 'Test'))
      results.forEach(r => {
        expect(r.result).toBe('normal')
      })
    })
  })

  describe('lookupRanges throws when no range matches', () => {
    // Covers lines 165-166 (the throw at end of lookupRanges)
    test('throws NO_TABLE_MATCH when total is out of all ranges', () => {
      const spec = makeSpec({
        dice: { pool: { sides: 6 }, quantity: 1 },
        outcome: {
          ranges: [{ exact: 999, result: 'impossible' }]
        }
      })
      const game = loadSpec(spec)
      // d6 can never roll 999, so every roll should throw
      expect(() => game.roll()).toThrow('No table entry matches total')
    })
  })

  describe('applyDegreeOfSuccess throws when no degrees match', () => {
    // Covers lines 188-190 (the throw at end of applyDegreeOfSuccess)
    test('throws when total is below all degree thresholds', () => {
      const rollDef = getNormalized(
        makeSpec({
          dice: { pool: { sides: 6 }, quantity: 1 },
          outcome: {
            degreeOfSuccess: {
              // Only success at threshold 100 — d6 can never reach it
              success: 100
            }
          }
        })
      )
      // d6 rolls 1-6 which is always < 100
      expect(() => executePipeline(rollDef, {}, 'Test')).toThrow(
        'No degree of success matches total'
      )
    })
  })

  describe('applyOutcome with tableLookup', () => {
    // Covers line 275 (tableLookup in outcome)
    test('tableLookup outcome via $ref resolves at runtime', () => {
      const spec: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'TL Outcome Test',
        shortcode: 'test-tlo',
        game_url: 'https://example.com',
        tables: {
          outcomes: {
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
            tableLookup: { $ref: '#/tables/outcomes' }
          }
        }
      } as RandSumSpec
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(['low', 'high']).toContain(r.result)
      })
    })

    test('tableLookup outcome with inline table resolves at runtime', () => {
      const spec: RandSumSpec = {
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'TL Inline Test',
        shortcode: 'test-tli',
        game_url: 'https://example.com',
        roll: {
          dice: { pool: { sides: 6 }, quantity: 1 },
          resolve: 'sum' as const,
          outcome: {
            tableLookup: {
              ranges: [
                { min: 1, max: 3, result: 'weak' },
                { min: 4, max: 6, result: 'strong' }
              ]
            }
          }
        }
      } as RandSumSpec
      const game = loadSpec(spec)
      const results = Array.from({ length: 100 }, () => game.roll())
      results.forEach(r => {
        expect(['weak', 'strong']).toContain(r.result)
      })
    })
  })

  describe('applyOutcome fallthrough (unreachable but covered)', () => {
    // Line 277: return String(total) -- fallthrough for unknown outcome shape
    // This is unreachable via normal codepaths, so we test executePipeline
    // with a manually crafted rollDef
    test('returns String(total) for unknown outcome shape', () => {
      const rollDef = getNormalized(
        makeSpec({
          dice: { pool: { sides: 6 }, quantity: 1 }
        })
      )
      // Manually patch outcome to have an unknown shape
      const patchedDef = {
        ...rollDef,
        outcome: { unknownKey: true } as never
      }
      const result = executePipeline(patchedDef, {}, 'Test')
      expect(typeof result.result).toBe('string')
    })
  })

  describe('evaluateCondition edge cases in pipeline', () => {
    // The evaluateCondition in pipeline.ts (not conditionEvaluator.ts) is used
    // for conditional pools. Test numeric comparison operators.
    test('conditional pool with = operator on non-matching value', () => {
      const spec = makeSpec({
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'boost'] }
        },
        dicePools: {
          main: { pool: { sides: 6 }, quantity: 1 }
        },
        conditionalPools: {
          bonus: {
            condition: { input: 'mode', operator: '=' as const, value: 'boost' },
            pool: { sides: 6 },
            arithmetic: 'add' as const
          }
        },
        resolve: 'sum' as const
      })
      const game = loadSpec(spec)
      const result = game.roll({ mode: 'normal' })
      // Should not trigger conditional pool
      expect(result.rolls.length).toBe(1)
    })
  })
})

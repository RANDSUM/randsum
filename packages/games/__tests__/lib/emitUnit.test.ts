import { describe, expect, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import type { RandSumSpec } from '../../src/lib/types'

describe('emitHelpers: specToFilename', () => {
  test('lowercases and replaces spaces with hyphens', async () => {
    const { specToFilename } = await import('../../src/lib/codegen/emitHelpers')
    expect(specToFilename('My Cool Game')).toBe('my-cool-game')
  })

  test('removes non-alphanumeric characters except hyphens', async () => {
    const { specToFilename } = await import('../../src/lib/codegen/emitHelpers')
    expect(specToFilename('Test & Fun!')).toBe('test--fun')
  })
})

describe('emitHelpers: toDiceConfig with empty array', () => {
  test('throws for empty dice array', async () => {
    const { toDiceConfig } = await import('../../src/lib/codegen/emitHelpers')
    expect(() => toDiceConfig([] as never)).toThrow('dice array is empty')
  })
})

describe('emitModifiers: cap modifier codegen', () => {
  test('generates cap with min only', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Cap Min Test',
      shortcode: 'test-capmin',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 4 },
        modify: [{ cap: { min: 2 } }],
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('cap: { lessThan: 2 }')
  })

  test('generates cap with max only', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Cap Max Test',
      shortcode: 'test-capmax',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 4 },
        modify: [{ cap: { max: 5 } }],
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('cap: { greaterThan: 5 }')
  })

  test('generates cap with both min and max', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Cap Both Test',
      shortcode: 'test-capboth',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 4 },
        modify: [{ cap: { min: 2, max: 5 } }],
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('cap: { lessThan: 2, greaterThan: 5 }')
  })
})

describe('emitOutcome: buildRangeReturn edge cases (direct)', () => {
  test('range with only min (no max)', async () => {
    const { buildRangeReturn } = await import('../../src/lib/codegen/emitOutcome')
    const range = { min: 15, result: 'high' }
    const result = buildRangeReturn(range, '  ', undefined, false, false)
    expect(result).toContain('total >= 15')
  })

  test('range with only max (no min)', async () => {
    const { buildRangeReturn } = await import('../../src/lib/codegen/emitOutcome')
    const range = { max: 5, result: 'low' }
    const result = buildRangeReturn(range, '  ', undefined, false, false)
    expect(result).toContain('total <= 5')
  })

  test('range with no min/max/exact and no poolCondition returns default', async () => {
    const { buildRangeReturn } = await import('../../src/lib/codegen/emitOutcome')
    const range = { result: 'always' }
    const result = buildRangeReturn(range, '  ', undefined, false, false)
    expect(result).toContain("return { total, result: 'always'")
  })

  test('poolCondition with atLeastRatio', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Pool Ratio Test',
      shortcode: 'test-poolratio',
      game_url: 'https://example.com',
      roll: {
        dice: { pool: { sides: 6 }, quantity: 4 },
        resolve: 'sum' as const,
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
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('preModify')
    expect(code).toContain('.length >= 0.5')
  })
})

describe('emitBody: multi-pool with no comparison (numeric result)', () => {
  test('multi-pool with sum resolve emits numeric return', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Multi Sum Test',
      shortcode: 'test-multisum',
      game_url: 'https://example.com',
      roll: {
        dicePools: {
          a: { pool: { sides: 6 }, quantity: 1 },
          b: { pool: { sides: 8 }, quantity: 1 }
        },
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    // Multi-pool sum resolve should produce numeric type
    expect(code).toContain('TestMultisumRollResult = number')
    expect(code).toContain('return { total, result: String(total)')
  })
})

describe('emitBody: when branch with dice override', () => {
  test('when override with dice produces correct code', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'When Override Test',
      shortcode: 'test-when',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'advantage'] }
        },
        dice: { pool: { sides: 20 }, quantity: 1 },
        resolve: 'sum' as const,
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'advantage' },
            override: {
              dice: { pool: { sides: 20 }, quantity: 2 },
              modify: [{ keepHighest: 1 }]
            }
          }
        ],
        outcome: {
          ranges: [
            { min: 1, max: 10, result: 'low' },
            { min: 11, max: 20, result: 'high' }
          ]
        }
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain("input.mode === 'advantage'")
    expect(code).toContain('keep: { highest: 1 }')
  })
})

describe('emitBody: when branch with no dice throws', () => {
  // This covers line 164 of emitBody.ts
  test('when branch override without dice fails if no default dice', async () => {
    // We can't easily trigger this through generateCode since validation catches it,
    // but we can import the function directly
    const { generateRollParts } = await import('../../src/lib/codegen/emitBody')
    const rollDef = {
      inputs: {
        mode: { type: 'string' as const, enum: ['a', 'b'] }
      },
      when: [
        {
          condition: { input: 'mode', operator: '=' as const, value: 'a' },
          override: {
            // no dice override, and rollDef has no dice
          }
        }
      ],
      resolve: 'sum' as const
    }
    expect(() => generateRollParts('roll', rollDef as never, 'Test', 'test')).toThrow(
      'when branch has no dice'
    )
  })
})

describe('emitBody: multi-pool with diceTotal but no postResolve', () => {
  test('does not emit separate diceTotal when no postResolve modifiers', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Multi NoPost Test',
      shortcode: 'test-multinopost',
      game_url: 'https://example.com',
      roll: {
        dicePools: {
          hope: { pool: { sides: 12 }, quantity: 1 },
          fear: { pool: { sides: 12 }, quantity: 1 }
        },
        resolve: 'sum' as const,
        details: {
          diceTotal: { expr: 'diceTotal' as const }
        }
      }
    }
    const code = await generateCode(spec)
    // Without postResolveModifiers, diceTotal should use 'total' directly
    expect(code).toContain('diceTotal: total')
    expect(code).not.toContain('const diceTotal = total')
  })
})

describe('emitBody: multi-pool with postResolve and diceTotal', () => {
  test('emits const diceTotal = total before postResolve', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Multi Post Test',
      shortcode: 'test-multipost',
      game_url: 'https://example.com',
      roll: {
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
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('const diceTotal = total')
    expect(code).toContain('diceTotal: diceTotal')
  })
})

describe('emitBody: opaque result type', () => {
  test('opaque result when outcome has empty ranges', async () => {
    const { collectResults } = await import('../../src/lib/codegen/emitHelpers')
    const rollDef = {
      resolve: 'sum' as const,
      dice: { pool: { sides: 6 }, quantity: 1 },
      outcome: { ranges: [] }
    }
    const result = collectResults(rollDef as never)
    expect(result.kind).toBe('opaque')
  })

  test('opaque result type emits string type alias through generateRollParts', async () => {
    const { generateRollParts } = await import('../../src/lib/codegen/emitBody')
    // A rollDef whose collectResults returns 'opaque' -- outcome with empty result strings
    const rollDef = {
      resolve: 'sum' as const,
      dice: { pool: { sides: 6 }, quantity: 1 },
      outcome: { ranges: [] as never[] }
    }
    const parts = generateRollParts('roll', rollDef as never, 'Test', 'test')
    // Should contain `export type TestRollResult = string`
    expect(parts.some(p => p.includes('TestRollResult = string'))).toBe(true)
  })
})

describe('emitBody: result-mapping type (line 309-311)', () => {
  test('emits result-mapping interface for remoteTableLookup spec', async () => {
    const { collectResults } = await import('../../src/lib/codegen/emitHelpers')
    const rollDef = {
      resolve: {
        remoteTableLookup: {
          url: 'https://example.com',
          find: { field: 'name', input: 'tableName' },
          tableField: 'table',
          resultMapping: { key: { $lookupResult: 'key' } }
        }
      },
      dice: { pool: { sides: 20 }, quantity: 1 }
    }
    const result = collectResults(rollDef as never)
    expect(result.kind).toBe('result-mapping')
  })
})

describe('emitHelpers: needsValidationImports', () => {
  test('returns both when integer inputs have min/max', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Validation Test',
      shortcode: 'test-valid',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          bonus: { type: 'integer' as const, minimum: -5, maximum: 5, default: 0 }
        },
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('validateFinite')
    expect(code).toContain('validateRange')
  })

  test('returns needsFinite only when integer input without min/max', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Finite Only Test',
      shortcode: 'test-finite',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          count: { type: 'integer' as const, default: 1 }
        },
        dice: { pool: { sides: 6 }, quantity: { $input: 'count' } },
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('validateFinite')
    expect(code).not.toContain('validateRange')
  })
})

describe('emitBody: single-pool with no dice throws', () => {
  // Covers line 204 of emitBody.ts
  test('function body throws when dice is undefined', async () => {
    const { generateRollParts } = await import('../../src/lib/codegen/emitBody')
    const rollDef = {
      resolve: 'sum' as const
      // no dice, no dicePools
    }
    expect(() => generateRollParts('roll', rollDef as never, 'Test', 'test')).toThrow(
      'rollDef.dice is required'
    )
  })
})

describe('emitOutcome: degreeOfSuccess codegen', () => {
  test('emits degree lines with all four thresholds', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Full DOS Test',
      shortcode: 'test-fulldos',
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
    }
    const code = await generateCode(spec)
    expect(code).toContain('if (total >= 20)')
    expect(code).toContain('if (total >= 10)')
    expect(code).toContain('if (total >= 2)')
    expect(code).toContain("return { total, result: 'criticalFailure'")
  })
})

describe('emitHelpers: inputTsType for boolean', () => {
  test('boolean input generates boolean type', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Bool Test',
      shortcode: 'test-bool',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          flag: { type: 'boolean' as const, optional: true }
        },
        dice: { pool: { sides: 6 }, quantity: 1 },
        resolve: 'sum' as const
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('flag?: boolean')
  })
})

describe('emitHelpers: integerOrInputCode with conditional', () => {
  test('conditional input generates ternary', async () => {
    const spec: RandSumSpec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'Cond Input Test',
      shortcode: 'test-cond',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          big: { type: 'boolean' as const, default: false }
        },
        dice: {
          pool: { sides: { $input: 'big', ifTrue: 20, ifFalse: 6 } },
          quantity: 1
        },
        resolve: 'sum' as const
      }
    } as RandSumSpec
    const code = await generateCode(spec)
    expect(code).toContain('? 20 : 6')
  })
})

describe('emitBody: when branch with postModify poolCondition', () => {
  test('emits postModify flatMap for poolCondition with postModify pool', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'PostModify Pool Test',
      shortcode: 'test-pmpool',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'special'] }
        },
        dice: { pool: { sides: 6 }, quantity: 4 },
        modify: [{ keepHighest: 3 }],
        resolve: 'sum' as const,
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'special' },
            override: {
              outcome: {
                ranges: [
                  {
                    result: 'hit',
                    poolCondition: {
                      pool: 'postModify' as const,
                      countWhere: { operator: '>=' as const, value: 4 },
                      atLeast: 2
                    }
                  },
                  { min: 1, max: 99, result: 'miss' }
                ]
              }
            }
          }
        ],
        outcome: {
          ranges: [
            { min: 1, max: 18, result: 'miss' },
            { min: 19, max: 99, result: 'hit' }
          ]
        }
      }
    }
    const code = await generateCode(spec)
    expect(code).toContain('const postModify = r.rolls.flatMap(x => x.rolls)')
  })
})

describe('emitBody: when branch with diceTotal details', () => {
  test('emits diceTotal capture inside when branch', async () => {
    const spec = {
      $schema: 'https://randsum.dev/schemas/v1/randsum.json',
      name: 'When DiceTotal Test',
      shortcode: 'test-whendt',
      game_url: 'https://example.com',
      roll: {
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'special'] },
          bonus: { type: 'integer' as const, default: 0 }
        },
        dice: { pool: { sides: 20 }, quantity: 1 },
        postResolveModifiers: [{ add: { $input: 'bonus' } }],
        resolve: 'sum' as const,
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'special' },
            override: {
              dice: { pool: { sides: 20 }, quantity: 2 },
              modify: [{ keepHighest: 1 }]
            }
          }
        ],
        details: {
          diceTotal: { expr: 'diceTotal' as const },
          modifier: { $input: 'bonus', default: 0 }
        }
      }
    }
    const code = await generateCode(spec)
    // Inside the when branch, should capture diceTotal
    expect(code).toContain('const diceTotal = r.rolls.flatMap(x => x.rolls)')
  })
})

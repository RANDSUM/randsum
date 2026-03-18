import { describe, expect, test } from 'bun:test'
import { generateCode } from '../../src/lib/codegen'
import { loadSpec, validateSpec } from '../../src/lib'

const COND_POOL_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Conditional Pool Test',
  shortcode: 'test-cp',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      rollingWith: {
        type: 'string' as const,
        enum: ['Advantage', 'Disadvantage']
      }
    },
    dicePools: {
      hope: { pool: { sides: 12 }, quantity: 1 },
      fear: { pool: { sides: 12 }, quantity: 1 }
    },
    conditionalPools: {
      advantage: {
        condition: { input: 'rollingWith', operator: '=' as const, value: 'Advantage' },
        pool: { sides: 6 },
        arithmetic: 'add' as const
      },
      disadvantage: {
        condition: { input: 'rollingWith', operator: '=' as const, value: 'Disadvantage' },
        pool: { sides: 6 },
        arithmetic: 'subtract' as const
      }
    },
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'],
        ties: 'tie',
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    }
  }
}

describe('conditionalPools schema validation', () => {
  test('spec with conditionalPools is valid', () => {
    const result = validateSpec(COND_POOL_SPEC)
    expect(result.valid).toBe(true)
  })

  test('conditionalPool with missing arithmetic is invalid', () => {
    const result = validateSpec({
      ...COND_POOL_SPEC,
      roll: {
        ...COND_POOL_SPEC.roll,
        conditionalPools: {
          advantage: {
            condition: {
              input: 'rollingWith',
              operator: '=',
              value: 'Advantage'
            },
            pool: { sides: 6 }
            // missing arithmetic
          }
        }
      }
    })
    expect(result.valid).toBe(false)
  })
})

describe('conditionalPools runtime', () => {
  test('advantage adds d6 to total', () => {
    const game = loadSpec(COND_POOL_SPEC)
    const results = Array.from({ length: 50 }, () => game.roll({ rollingWith: 'Advantage' }))
    // With advantage: total = hope(1-12) + fear(1-12) + d6(1-6) = 3-30
    results.forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(3)
      expect(r.total).toBeLessThanOrEqual(30)
    })
    // Should have 3 roll records (hope, fear, advantage die)
    results.forEach(r => {
      expect(r.rolls.length).toBe(3)
    })
  })

  test('disadvantage subtracts d6 from total', () => {
    const game = loadSpec(COND_POOL_SPEC)
    const results = Array.from({ length: 50 }, () => game.roll({ rollingWith: 'Disadvantage' }))
    // With disadvantage: total = hope(1-12) + fear(1-12) - d6(1-6) = -4 to 23
    results.forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(-4)
      expect(r.total).toBeLessThanOrEqual(23)
    })
    // Should have 3 roll records
    results.forEach(r => {
      expect(r.rolls.length).toBe(3)
    })
  })

  test('no rollingWith means no extra pool', () => {
    const game = loadSpec(COND_POOL_SPEC)
    const results = Array.from({ length: 20 }, () => game.roll())
    // Without rollingWith: total = hope(1-12) + fear(1-12) = 2-24
    results.forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(2)
      expect(r.total).toBeLessThanOrEqual(24)
    })
    // Should have only 2 roll records
    results.forEach(r => {
      expect(r.rolls.length).toBe(2)
    })
  })
})

describe('conditionalPools codegen', () => {
  test('generates conditional pool code blocks', async () => {
    const code = await generateCode(COND_POOL_SPEC)
    expect(code).toContain("'Advantage'")
    expect(code).toContain("'Disadvantage'")
    expect(code).toContain('cpResult')
    expect(code).toContain('+= cpTotal')
    expect(code).toContain('-= cpTotal')
  })

  test('generated code uses const accumulator for mutable total', async () => {
    const code = await generateCode(COND_POOL_SPEC)
    expect(code).toContain('const acc = { total:')
    expect(code).toContain('const total = acc.total')
  })
})

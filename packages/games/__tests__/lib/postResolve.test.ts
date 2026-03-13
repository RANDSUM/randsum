import { describe, expect, test } from 'bun:test'
import { loadSpec, validateSpec } from '../../src/lib'
import { generateCode } from '../../src/lib/codegen'

const BASE = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Test',
  shortcode: 'test-pr',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 2 },
    resolve: 'sum' as const,
    outcome: {
      ranges: [
        { min: 1, max: 6, result: 'low' },
        { min: 7, max: 99, result: 'high' }
      ]
    }
  }
}

describe('postResolveModifiers schema validation', () => {
  test('spec without postResolveModifiers is valid', () => {
    const result = validateSpec(BASE)
    expect(result.valid).toBe(true)
  })

  test('spec with postResolveModifiers add (number) is valid', () => {
    const result = validateSpec({
      ...BASE,
      roll: { ...BASE.roll, postResolveModifiers: [{ add: 3 }] }
    })
    expect(result.valid).toBe(true)
  })

  test('spec with postResolveModifiers add ($input) is valid', () => {
    const result = validateSpec({
      ...BASE,
      roll: {
        ...BASE.roll,
        inputs: { bonus: { type: 'integer', default: 0 } },
        postResolveModifiers: [{ add: { $input: 'bonus' } }]
      }
    })
    expect(result.valid).toBe(true)
  })

  test('postResolveModifiers with unknown field is invalid', () => {
    const result = validateSpec({
      ...BASE,
      roll: { ...BASE.roll, postResolveModifiers: [{ unknownField: 3 }] }
    })
    expect(result.valid).toBe(false)
  })

  test('empty postResolveModifiers array is valid', () => {
    const result = validateSpec({
      ...BASE,
      roll: { ...BASE.roll, postResolveModifiers: [] }
    })
    // Empty array is allowed — no minItems constraint on the array itself
    expect(result.valid).toBe(true)
  })

  test('multiple post-resolve modifiers are valid', () => {
    const result = validateSpec({
      ...BASE,
      roll: {
        ...BASE.roll,
        inputs: { a: { type: 'integer', default: 0 }, b: { type: 'integer', default: 0 } },
        postResolveModifiers: [{ add: { $input: 'a' } }, { add: { $input: 'b' } }]
      }
    })
    expect(result.valid).toBe(true)
  })

  test('postResolveModifiers in when override is valid', () => {
    const result = validateSpec({
      ...BASE,
      roll: {
        ...BASE.roll,
        inputs: { mode: { type: 'string', enum: ['normal', 'bonus'], default: 'normal' } },
        when: [
          {
            condition: { input: 'mode', operator: '=', value: 'bonus' },
            override: { postResolveModifiers: [{ add: 5 }] }
          }
        ]
      }
    })
    expect(result.valid).toBe(true)
  })
})

describe('postResolveModifiers runtime behavior', () => {
  const SPEC_WITH_BONUS = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Bonus Test',
    shortcode: 'test-bonus',
    game_url: 'https://example.com',
    roll: {
      inputs: { bonus: { type: 'integer' as const, default: 0 } },
      dice: { pool: { sides: 6 }, quantity: 2 },
      resolve: 'sum' as const,
      postResolveModifiers: [{ add: { $input: 'bonus' } }],
      outcome: {
        ranges: [{ min: 1, max: 999, result: 'any' }]
      }
    }
  }

  test('bonus 100 makes total >= 102 (proves bonus applied after sum, not per-die)', () => {
    const game = loadSpec(SPEC_WITH_BONUS)
    // 2d6 min is 2. With bonus 100, total must be >= 102.
    // If bonus were per-die: 2*(1+100) = 202 minimum — different value, not what we test.
    // With post-resolve: total = (sum of 2d6) + 100 ∈ [102, 112].
    Array.from({ length: 20 }, () => game.roll({ bonus: 100 })).forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(102)
      expect(r.total).toBeLessThanOrEqual(112)
    })
  })

  test('bonus 0 leaves total in 2d6 range [2, 12]', () => {
    const game = loadSpec(SPEC_WITH_BONUS)
    Array.from({ length: 50 }, () => game.roll({ bonus: 0 })).forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(2)
      expect(r.total).toBeLessThanOrEqual(12)
    })
  })

  test('static bonus (number literal) works', () => {
    const game = loadSpec({
      ...SPEC_WITH_BONUS,
      roll: {
        ...SPEC_WITH_BONUS.roll,
        postResolveModifiers: [{ add: 10 }]
      }
    })
    Array.from({ length: 20 }, () => game.roll()).forEach(r => {
      expect(r.total).toBeGreaterThanOrEqual(12) // 2+10
      expect(r.total).toBeLessThanOrEqual(22) // 12+10
    })
  })

  test('postResolveModifiers in when override applies correctly', () => {
    const game = loadSpec({
      ...SPEC_WITH_BONUS,
      roll: {
        ...SPEC_WITH_BONUS.roll,
        inputs: {
          mode: { type: 'string' as const, enum: ['normal', 'boosted'], default: 'normal' }
        },
        postResolveModifiers: [],
        when: [
          {
            condition: { input: 'mode', operator: '=' as const, value: 'boosted' },
            override: { postResolveModifiers: [{ add: 50 }] }
          }
        ]
      }
    })
    const boosted = game.roll({ mode: 'boosted' })
    expect(boosted.total).toBeGreaterThanOrEqual(52)
  })
})

describe('postResolveModifiers codegen', () => {
  const CODEGEN_SPEC = {
    $schema: 'https://randsum.dev/schemas/v1/randsum.json',
    name: 'Codegen Test',
    shortcode: 'test-cg',
    game_url: 'https://example.com',
    roll: {
      inputs: { bonus: { type: 'integer' as const, default: 0 } },
      dice: { pool: { sides: 6 }, quantity: 2 },
      resolve: 'sum' as const,
      postResolveModifiers: [{ add: { $input: 'bonus' } }],
      outcome: {
        ranges: [
          { min: 1, max: 10, result: 'low' },
          { min: 11, max: 999, result: 'high' }
        ]
      }
    }
  }

  test('generated code adds bonus to r.total', async () => {
    const code = await generateCode(CODEGEN_SPEC)
    // Should contain r.total + something, not just r.total
    expect(code).toMatch(/r\.total \+/)
  })

  test('generated code references the bonus input', async () => {
    const code = await generateCode(CODEGEN_SPEC)
    expect(code).toContain('bonus')
  })

  test('no postResolveModifiers: generates plain r.total', async () => {
    const specNoBonus = {
      ...CODEGEN_SPEC,
      roll: { ...CODEGEN_SPEC.roll, postResolveModifiers: undefined }
    }
    const code = await generateCode(specNoBonus)
    // Should be exactly r.total, not r.total + anything
    expect(code).toContain('const total = r.total')
    expect(code).not.toMatch(/r\.total \+/)
  })
})

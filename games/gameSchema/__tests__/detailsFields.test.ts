import { describe, expect, test } from 'bun:test'
import { generateCode } from '../src/codegen'
import { loadSpec } from '../src/loader'
import { validateSpec } from '../src'

const DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Details Test',
  shortcode: 'test-details',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      modifier: { type: 'integer' as const, default: 0 }
    },
    dice: { pool: { sides: 20 }, quantity: 1 },
    postResolveModifiers: [{ add: { $input: 'modifier' } }],
    resolve: 'sum' as const,
    outcome: {
      degreeOfSuccess: {
        criticalSuccess: 20,
        success: 10,
        failure: 2,
        criticalFailure: 1
      }
    },
    details: {
      diceTotal: { expr: 'diceTotal' as const },
      total: { expr: 'total' as const },
      modifier: { $input: 'modifier', default: 0 }
    }
  }
}

describe('details fields schema validation', () => {
  test('spec with details is valid', () => {
    const result = validateSpec(DETAILS_SPEC)
    expect(result.valid).toBe(true)
  })

  test('details with invalid expr is invalid', () => {
    const result = validateSpec({
      ...DETAILS_SPEC,
      roll: {
        ...DETAILS_SPEC.roll,
        details: {
          bad: { expr: 'invalid' }
        }
      }
    })
    expect(result.valid).toBe(false)
  })
})

describe('details fields codegen', () => {
  test('emits RollDetails interface', () => {
    const code = generateCode(DETAILS_SPEC)
    expect(code).toContain('export interface RollDetails')
    expect(code).toContain('readonly diceTotal: number')
    expect(code).toContain('readonly total: number')
    expect(code).toContain('readonly modifier: number')
  })

  test('return type includes RollDetails', () => {
    const code = generateCode(DETAILS_SPEC)
    expect(code).toContain('GameRollResult<RollResult, RollDetails, RollRecord>')
  })

  test('captures diceTotal before postResolveModifiers', () => {
    const code = generateCode(DETAILS_SPEC)
    expect(code).toContain('const diceTotal = r.total')
  })

  test('builds details object', () => {
    const code = generateCode(DETAILS_SPEC)
    expect(code).toContain('const details = {')
    expect(code).toContain('diceTotal: diceTotal')
    expect(code).toContain('total: total')
    expect(code).toContain('modifier:')
  })

  test('return statements include details', () => {
    const code = generateCode(DETAILS_SPEC)
    expect(code).toContain(', details }')
  })
})

describe('details fields runtime (loadSpec)', () => {
  test('returns details object with correct fields', () => {
    const loaded = loadSpec(DETAILS_SPEC)
    const result = loaded.roll({ modifier: 3 })
    expect(result.details).toBeDefined()
    expect(result.details!.modifier).toBe(3)
    expect(typeof result.details!.diceTotal).toBe('number')
    expect(typeof result.details!.total).toBe('number')
    expect(result.details!.total).toBe(result.total)
  })

  test('diceTotal differs from total when modifier applied', () => {
    const loaded = loadSpec(DETAILS_SPEC)
    const result = loaded.roll({ modifier: 5 })
    expect(result.details!.diceTotal).toBe(result.total - 5)
  })

  test('uses default when input not provided', () => {
    const loaded = loadSpec(DETAILS_SPEC)
    const result = loaded.roll()
    expect(result.details!.modifier).toBe(0)
  })
})

const NO_DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'No Details Test',
  shortcode: 'test-no-details',
  game_url: 'https://example.com',
  roll: {
    dice: { pool: { sides: 6 }, quantity: 2 },
    resolve: 'sum' as const
  }
}

describe('no details fields', () => {
  test('return type is GameRollResult<..., undefined, ...> when no details', () => {
    const code = generateCode(NO_DETAILS_SPEC)
    expect(code).toContain('GameRollResult<RollResult, undefined, RollRecord>')
    expect(code).not.toContain('RollDetails')
  })

  test('runtime returns no details property', () => {
    const loaded = loadSpec(NO_DETAILS_SPEC)
    const result = loaded.roll()
    expect(result.details).toBeUndefined()
  })
})

// --- #992: Extended DetailsFieldDef ---

const NESTED_DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Nested Details Test',
  shortcode: 'test-nested',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      bonus: { type: 'integer' as const, default: 0 }
    },
    dice: { pool: { sides: 12 }, quantity: 2 },
    resolve: 'sum' as const,
    details: {
      diceTotal: { expr: 'diceTotal' as const },
      stats: {
        total: { expr: 'total' as const },
        bonus: { $input: 'bonus', default: 0 }
      }
    }
  }
}

describe('nested details objects (#992)', () => {
  test('schema validates nested details', () => {
    const result = validateSpec(NESTED_DETAILS_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits nested object type', () => {
    const code = generateCode(NESTED_DETAILS_SPEC)
    expect(code).toContain('export interface RollDetails')
    expect(code).toContain('readonly diceTotal: number')
    expect(code).toContain('readonly stats: { readonly total: number; readonly bonus: number }')
  })

  test('codegen emits nested object construction', () => {
    const code = generateCode(NESTED_DETAILS_SPEC)
    expect(code).toContain('stats: { total: total, bonus:')
  })

  test('runtime returns nested details object', () => {
    const loaded = loadSpec(NESTED_DETAILS_SPEC)
    const result = loaded.roll({ bonus: 7 })
    expect(result.details).toBeDefined()
    expect(typeof result.details!.diceTotal).toBe('number')
    const stats = result.details!.stats as { total: number; bonus: number }
    expect(stats.total).toBe(result.total)
    expect(stats.bonus).toBe(7)
  })
})

const POOL_REF_DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Pool Ref Details Test',
  shortcode: 'test-poolref',
  game_url: 'https://example.com',
  roll: {
    dicePools: {
      hope: { pool: { sides: 12 }, quantity: 2 },
      fear: { pool: { sides: 12 }, quantity: 2 }
    },
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'] as readonly [string, string],
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    },
    details: {
      hopeTotal: { $pool: 'hope', field: 'total' as const },
      fearTotal: { $pool: 'fear', field: 'total' as const }
    }
  }
}

describe('$pool ref details (#992)', () => {
  test('schema validates $pool details', () => {
    const result = validateSpec(POOL_REF_DETAILS_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits pool total references', () => {
    const code = generateCode(POOL_REF_DETAILS_SPEC)
    expect(code).toContain('hopeTotal: hopeTotal')
    expect(code).toContain('fearTotal: fearTotal')
  })

  test('runtime returns pool totals in details', () => {
    const loaded = loadSpec(POOL_REF_DETAILS_SPEC)
    const result = loaded.roll()
    expect(result.details).toBeDefined()
    expect(typeof result.details!.hopeTotal).toBe('number')
    expect(typeof result.details!.fearTotal).toBe('number')
    const hopeTotal = result.details!.hopeTotal as number
    const fearTotal = result.details!.fearTotal as number
    expect(hopeTotal).toBeGreaterThanOrEqual(2)
    expect(hopeTotal).toBeLessThanOrEqual(24)
    expect(fearTotal).toBeGreaterThanOrEqual(2)
    expect(fearTotal).toBeLessThanOrEqual(24)
  })
})

const CONDITIONAL_POOL_DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Conditional Pool Details Test',
  shortcode: 'test-cpref',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      advantage: {
        type: 'boolean' as const,
        optional: true
      }
    },
    dicePools: {
      hope: { pool: { sides: 12 }, quantity: 2 },
      fear: { pool: { sides: 12 }, quantity: 2 }
    },
    conditionalPools: [
      {
        condition: { input: 'advantage', operator: '=' as const, value: true },
        pool: { sides: 12, quantity: 1 },
        arithmetic: 'add' as const
      }
    ],
    resolve: {
      comparePoolHighest: {
        pools: ['hope', 'fear'] as readonly [string, string],
        outcomes: { hope: 'hope', fear: 'fear' }
      }
    },
    details: {
      hopeTotal: { $pool: 'hope', field: 'total' as const },
      bonusPool: { $conditionalPool: 0, field: 'total' as const }
    }
  }
}

describe('$conditionalPool ref details (#992)', () => {
  test('schema validates $conditionalPool details', () => {
    const result = validateSpec(CONDITIONAL_POOL_DETAILS_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen tracks conditional pool total by index', () => {
    const code = generateCode(CONDITIONAL_POOL_DETAILS_SPEC)
    expect(code).toContain('let conditionalPool0Total = 0')
    expect(code).toContain('conditionalPool0Total = cpTotal')
    expect(code).toContain('bonusPool: conditionalPool0Total')
  })

  test('runtime returns 0 for conditional pool when condition not met', () => {
    const loaded = loadSpec(CONDITIONAL_POOL_DETAILS_SPEC)
    const result = loaded.roll()
    expect(result.details).toBeDefined()
    expect(result.details!.bonusPool).toBe(0)
  })

  test('runtime returns nonzero for conditional pool when condition met', () => {
    const loaded = loadSpec(CONDITIONAL_POOL_DETAILS_SPEC)
    // Run multiple times to ensure at least one produces a nonzero
    let found = false
    for (let i = 0; i < 50; i++) {
      const result = loaded.roll({ advantage: true })
      const bonusPool = result.details!.bonusPool as number
      if (bonusPool > 0) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})

const CONDITIONAL_DETAILS_SPEC = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Conditional Details Test',
  shortcode: 'test-conddet',
  game_url: 'https://example.com',
  roll: {
    inputs: {
      advantage: {
        type: 'boolean' as const,
        optional: true
      }
    },
    dice: { pool: { sides: 20 }, quantity: 1 },
    resolve: 'sum' as const,
    details: {
      diceTotal: { expr: 'diceTotal' as const },
      advantageInfo: {
        when: { input: 'advantage' },
        value: {
          active: { $input: 'advantage' },
          roll: { expr: 'total' as const }
        }
      }
    }
  }
}

describe('conditional (when) details (#992)', () => {
  test('schema validates conditional details', () => {
    const result = validateSpec(CONDITIONAL_DETAILS_SPEC)
    expect(result.valid).toBe(true)
  })

  test('codegen emits conditional details type as union with undefined', () => {
    const code = generateCode(CONDITIONAL_DETAILS_SPEC)
    expect(code).toContain(
      'readonly advantageInfo: { readonly active: boolean; readonly roll: number } | undefined'
    )
  })

  test('codegen emits ternary for conditional field', () => {
    const code = generateCode(CONDITIONAL_DETAILS_SPEC)
    expect(code).toContain('advantageInfo: input?.advantage !== undefined ?')
  })

  test('runtime returns undefined for conditional when input missing', () => {
    const loaded = loadSpec(CONDITIONAL_DETAILS_SPEC)
    const result = loaded.roll()
    expect(result.details).toBeDefined()
    expect(result.details!.advantageInfo).toBeUndefined()
  })

  test('runtime returns nested object for conditional when input provided', () => {
    const loaded = loadSpec(CONDITIONAL_DETAILS_SPEC)
    const result = loaded.roll({ advantage: true })
    expect(result.details).toBeDefined()
    const info = result.details!.advantageInfo as { active: boolean; roll: number }
    expect(info).toBeDefined()
    expect(info.active).toBe(true)
    expect(info.roll).toBe(result.total)
  })
})

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

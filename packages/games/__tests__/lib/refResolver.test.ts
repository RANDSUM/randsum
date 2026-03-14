import { describe, expect, test } from 'bun:test'
import {
  isRef,
  resolveOutcomeRef,
  resolvePoolRef,
  resolveRef,
  resolveTableRef
} from '../../src/lib/refResolver'
import { SchemaError } from '../../src/lib/errors'
import type { RandSumSpec } from '../../src/lib/types'

const BASE_SPEC: RandSumSpec = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Ref Test',
  shortcode: 'test-ref',
  game_url: 'https://example.com',
  pools: {
    actionDice: { sides: 6, quantity: 2 }
  },
  tables: {
    mainTable: {
      ranges: [
        { min: 1, max: 3, result: 'low' },
        { min: 4, max: 6, result: 'high' }
      ]
    }
  },
  outcomes: {
    mainOutcome: {
      ranges: [
        { min: 1, max: 3, result: 'fail' },
        { min: 4, max: 6, result: 'pass' }
      ]
    },
    degreeOutcome: {
      degreeOfSuccess: {
        success: 10,
        failure: 0
      }
    },
    tableOutcome: {
      tableLookup: {
        ranges: [{ min: 1, max: 6, result: 'result' }]
      }
    }
  },
  roll: {
    dice: { pool: { $ref: '#/pools/actionDice' } },
    resolve: 'sum' as const
  }
} as RandSumSpec

describe('isRef', () => {
  test('returns true for object with $ref string', () => {
    expect(isRef({ $ref: '#/pools/actionDice' })).toBe(true)
  })

  test('returns false for null', () => {
    expect(isRef(null)).toBe(false)
  })

  test('returns false for non-object', () => {
    expect(isRef('string')).toBe(false)
  })

  test('returns false for object without $ref', () => {
    expect(isRef({ sides: 6 })).toBe(false)
  })

  test('returns false for object with non-string $ref', () => {
    expect(isRef({ $ref: 42 })).toBe(false)
  })
})

describe('resolveRef', () => {
  test('resolves a valid path', () => {
    const result = resolveRef(BASE_SPEC, '#/pools/actionDice')
    expect(result).toEqual({ sides: 6, quantity: 2 })
  })

  test('resolves path without #/ prefix', () => {
    const result = resolveRef(BASE_SPEC, 'pools/actionDice')
    expect(result).toEqual({ sides: 6, quantity: 2 })
  })

  test('throws for non-object segment', () => {
    expect(() => resolveRef(BASE_SPEC, '#/name/foo')).toThrow(SchemaError)
    expect(() => resolveRef(BASE_SPEC, '#/name/foo')).toThrow('hit non-object')
  })

  test('throws for missing segment', () => {
    expect(() => resolveRef(BASE_SPEC, '#/pools/nonexistent')).toThrow(SchemaError)
    expect(() => resolveRef(BASE_SPEC, '#/pools/nonexistent')).toThrow(
      'segment "nonexistent" not found'
    )
  })
})

describe('resolvePoolRef', () => {
  test('resolves a valid pool ref', () => {
    const result = resolvePoolRef(BASE_SPEC, '#/pools/actionDice')
    expect(result.sides).toBe(6)
  })

  test('throws for ref that does not resolve to pool', () => {
    expect(() => resolvePoolRef(BASE_SPEC, '#/tables/mainTable')).toThrow(SchemaError)
    expect(() => resolvePoolRef(BASE_SPEC, '#/tables/mainTable')).toThrow(
      'does not resolve to a PoolDefinition'
    )
  })
})

describe('resolveTableRef', () => {
  test('resolves a valid table ref', () => {
    const result = resolveTableRef(BASE_SPEC, '#/tables/mainTable')
    expect(result.ranges).toHaveLength(2)
  })

  test('throws for ref that does not resolve to table', () => {
    expect(() => resolveTableRef(BASE_SPEC, '#/pools/actionDice')).toThrow(SchemaError)
    expect(() => resolveTableRef(BASE_SPEC, '#/pools/actionDice')).toThrow(
      'does not resolve to a TableDefinition'
    )
  })
})

describe('resolveOutcomeRef', () => {
  test('resolves outcome with ranges', () => {
    const result = resolveOutcomeRef(BASE_SPEC, '#/outcomes/mainOutcome')
    expect('ranges' in result).toBe(true)
  })

  test('resolves outcome with degreeOfSuccess', () => {
    const result = resolveOutcomeRef(BASE_SPEC, '#/outcomes/degreeOutcome')
    expect('degreeOfSuccess' in result).toBe(true)
  })

  test('resolves outcome with tableLookup', () => {
    const result = resolveOutcomeRef(BASE_SPEC, '#/outcomes/tableOutcome')
    expect('tableLookup' in result).toBe(true)
  })

  test('throws for ref that does not resolve to outcome', () => {
    expect(() => resolveOutcomeRef(BASE_SPEC, '#/pools/actionDice')).toThrow(SchemaError)
    expect(() => resolveOutcomeRef(BASE_SPEC, '#/pools/actionDice')).toThrow(
      'does not resolve to an OutcomeOperation'
    )
  })
})

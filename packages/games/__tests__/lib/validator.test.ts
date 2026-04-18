import { describe, expect, test } from 'bun:test'

import testSpec from './fixtures/test.randsum.json'
import { validateSpec } from '../../src/lib/validator'

const SPEC_WITH_OUTCOMES = {
  $schema: 'https://randsum.dev/schemas/v1/randsum.json',
  name: 'Outcomes Test Game',
  shortcode: 'otg',
  game_url: 'https://example.com',
  pools: { d6: { sides: 6 } },
  tables: {
    core: {
      ranges: [
        { exact: 6, result: 'success' },
        { min: 1, max: 5, result: 'failure' }
      ]
    }
  },
  outcomes: {
    coreOutcome: { tableLookup: { $ref: '#/tables/core' } },
    altOutcome: {
      ranges: [
        { exact: 6, result: 'win' },
        { min: 1, max: 5, result: 'lose' }
      ]
    }
  },
  roll: {
    inputs: { count: { type: 'integer', minimum: 1, default: 1 } },
    dice: { pool: { $ref: '#/pools/d6' }, quantity: { $input: 'count' } },
    modify: [{ keepHighest: 1 }],
    resolve: 'sum',
    outcome: { $ref: '#/outcomes/coreOutcome' }
  }
} as const

describe('validateSpec', () => {
  describe('valid specs', () => {
    test('accepts test.randsum.json', () => {
      const result = validateSpec(testSpec)
      expect(result.valid).toBe(true)
    })

    test('accepts spec with outcomes section and $ref outcomes', () => {
      const result = validateSpec(SPEC_WITH_OUTCOMES)
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid specs', () => {
    test('rejects null', () => {
      const result = validateSpec(null)
      expect(result.valid).toBe(false)
    })

    test('rejects missing required fields', () => {
      const result = validateSpec({ $schema: 'https://randsum.dev/schemas/v1/randsum.json' })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
      }
    })

    test('rejects wrong $schema value', () => {
      const result = validateSpec({
        $schema: 'https://example.com/wrong.json',
        name: 'Test',
        roll: { dice: { pool: { sides: 6 } }, resolve: 'sum' }
      })
      expect(result.valid).toBe(false)
    })

    test('rejects roll missing resolve', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        roll: { dice: { pool: { sides: 6 } } }
      })
      expect(result.valid).toBe(false)
    })

    test('returns structured errors with path and message', () => {
      const result = validateSpec({ name: 'Test' })
      expect(result.valid).toBe(false)
      if (!result.valid) {
        for (const err of result.errors) {
          expect(typeof err.path).toBe('string')
          expect(typeof err.message).toBe('string')
        }
      }
    })

    test('rejects modify with markDice but no keepMarked', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        shortcode: 'test',
        game_url: 'https://example.com',
        roll: {
          dice: { pool: { sides: 6 }, quantity: 3 },
          modify: [{ markDice: { operator: '>=', value: 4, flag: 'hit' } }],
          resolve: 'sum'
        }
      })
      expect(result.valid).toBe(false)
    })

    test('rejects modify with keepMarked but no markDice', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        shortcode: 'test',
        game_url: 'https://example.com',
        roll: {
          dice: { pool: { sides: 6 }, quantity: 3 },
          modify: [{ keepMarked: 'hit' }],
          resolve: 'sum'
        }
      })
      expect(result.valid).toBe(false)
    })

    test('accepts TableRange with min alone', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        shortcode: 'test',
        game_url: 'https://example.com',
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
      expect(result.valid).toBe(true)
    })

    test('rejects named roll keys like rollBonus (pattern removed)', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        shortcode: 'test',
        game_url: 'https://example.com',
        roll: { dice: { pool: { sides: 6 }, quantity: 1 }, resolve: 'sum' },
        rollBonus: { dice: { pool: { sides: 6 }, quantity: 1 }, resolve: 'sum' }
      })
      expect(result.valid).toBe(false)
    })

    test('accepts modify with both markDice and keepMarked', () => {
      const result = validateSpec({
        $schema: 'https://randsum.dev/schemas/v1/randsum.json',
        name: 'Test',
        shortcode: 'test',
        game_url: 'https://example.com',
        roll: {
          dice: { pool: { sides: 6 }, quantity: 3 },
          modify: [{ markDice: { operator: '>=', value: 4, flag: 'hit' } }, { keepMarked: 'hit' }],
          resolve: 'sum'
        }
      })
      expect(result.valid).toBe(true)
    })
  })
})

import { describe, expect, test } from 'bun:test'
import { validateSpec } from '../src'

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

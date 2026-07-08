import { describe, expect, test } from 'bun:test'
import { validateNotationInput } from '../src/tools/validate'

describe('validateNotationInput', () => {
  test('accepts valid notation with a description', () => {
    const result = validateNotationInput({ notation: '4d6L' })
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.suggestion).toBeUndefined()
    expect(typeof result.description).toBe('string')
    expect((result.description ?? '').length).toBeGreaterThan(0)
  })

  test('rejects invalid notation with an error', () => {
    const result = validateNotationInput({ notation: 'garbage' })
    expect(result.valid).toBe(false)
    expect(result.description).toBeUndefined()
    expect(typeof result.error).toBe('string')
  })

  test('offers a suggestion for a fixable typo', () => {
    const result = validateNotationInput({ notation: 'd20' })
    expect(result.valid).toBe(false)
    expect(result.suggestion).toBe('1d20')
  })
})

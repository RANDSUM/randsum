import { describe, expect, test } from 'bun:test'
import { runSimple } from '../../src/simple/run'

describe('runSimple', () => {
  test('returns compact output for valid notation', () => {
    const output = runSimple({
      notations: ['4d6L'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(output).toMatch(/^\d+/)
  })

  test('returns verbose output when verbose flag set', () => {
    const output = runSimple({
      notations: ['2d6'],
      verbose: true,
      json: false,
      repeat: 1
    })
    expect(output).toContain('Roll:')
    expect(output).toContain('Total:')
  })

  test('returns JSON output when json flag set', () => {
    const output = runSimple({
      notations: ['1d20'],
      verbose: false,
      json: true,
      repeat: 1
    })
    const parsed = JSON.parse(output) as Record<string, unknown>
    expect(parsed).toHaveProperty('total')
  })

  test('repeats rolls with repeat flag', () => {
    const output = runSimple({
      notations: ['1d6'],
      verbose: false,
      json: false,
      repeat: 3
    })
    const lines = output.split('\n').filter(Boolean)
    expect(lines).toHaveLength(3)
  })

  test('supports seeded random', () => {
    const a = runSimple({
      notations: ['2d6'],
      verbose: false,
      json: false,
      repeat: 1,
      seed: 42
    })
    const b = runSimple({
      notations: ['2d6'],
      verbose: false,
      json: false,
      repeat: 1,
      seed: 42
    })
    expect(a).toBe(b)
  })

  test('returns error for invalid notation', () => {
    const output = runSimple({
      notations: ['zzzz'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(output).toContain('Error:')
  })

  test('supports multiple notations', () => {
    const output = runSimple({
      notations: ['1d6', '1d8'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(output).toMatch(/^\d+/)
  })
})

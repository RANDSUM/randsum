import { describe, expect, test } from 'bun:test'
import { runRolls } from '../src/run'

describe('runRolls', () => {
  test('returns compact output for valid notation', () => {
    const result = runRolls({
      notations: ['4d6L'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(result.stdout).toMatch(/^\d+/)
    expect(result.hadError).toBe(false)
  })

  test('returns verbose output when verbose flag set', () => {
    const result = runRolls({
      notations: ['2d6'],
      verbose: true,
      json: false,
      repeat: 1
    })
    expect(result.stdout).toContain('Roll:')
    expect(result.stdout).toContain('Total:')
  })

  test('returns JSON output when json flag set', () => {
    const result = runRolls({
      notations: ['1d20'],
      verbose: false,
      json: true,
      repeat: 1
    })
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>
    expect(parsed).toHaveProperty('total')
  })

  test('repeats rolls with repeat flag', () => {
    const result = runRolls({
      notations: ['1d6'],
      verbose: false,
      json: false,
      repeat: 3
    })
    const lines = result.stdout.split('\n').filter(Boolean)
    expect(lines).toHaveLength(3)
  })

  test('supports seeded random', () => {
    const a = runRolls({
      notations: ['2d6'],
      verbose: false,
      json: false,
      repeat: 1,
      seed: 42
    })
    const b = runRolls({
      notations: ['2d6'],
      verbose: false,
      json: false,
      repeat: 1,
      seed: 42
    })
    expect(a.stdout).toBe(b.stdout)
  })

  test('routes errors to stderr and flags hadError', () => {
    const result = runRolls({
      notations: ['zzzz'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(result.stderr).toContain('Error:')
    expect(result.stdout).toBe('')
    expect(result.hadError).toBe(true)
  })

  test('supports multiple notations', () => {
    const result = runRolls({
      notations: ['1d6', '1d8'],
      verbose: false,
      json: false,
      repeat: 1
    })
    expect(result.stdout).toMatch(/^\d+/)
  })
})

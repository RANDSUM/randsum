import { describe, expect, test } from 'bun:test'
import { formatResult, isFormattedError } from '../src/formatResult'
import { roll } from '../src/roll'

describe('isFormattedError', () => {
  test('returns false for a FormattedResult', () => {
    const result = roll(6)
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
  })

  test('returns true for a FormattedError', () => {
    expect(isFormattedError({ error: 'something went wrong' })).toBe(true)
  })
})

describe('formatResult', () => {
  test('total matches roll total', () => {
    const result = roll(6)
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
    if (!isFormattedError(formatted)) {
      expect(formatted.total).toBe(result.total)
    }
  })

  test('rolls is an array of arrays', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    if (!isFormattedError(formatted)) {
      expect(formatted.rolls).toHaveLength(1)
      expect(formatted.rolls[0]).toHaveLength(2)
    }
  })

  test('description is always a non-empty string', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    if (!isFormattedError(formatted)) {
      expect(typeof formatted.description).toBe('string')
      expect(formatted.description.length).toBeGreaterThan(0)
    }
  })

  test('description fallback uses total when record descriptions are empty', () => {
    // Construct a synthetic result with empty description arrays to exercise fallback
    const result = roll('1d6')
    const syntheticResult = {
      ...result,
      rolls: result.rolls.map(r => ({ ...r, description: [] as string[] }))
    }
    const formatted = formatResult(syntheticResult)
    if (!isFormattedError(formatted)) {
      expect(formatted.description).toBe(`Total: ${result.total}`)
    }
  })

  test('handles multiple roll records (pool)', () => {
    const result = roll('1d6', '1d8')
    const formatted = formatResult(result)
    if (!isFormattedError(formatted)) {
      expect(formatted.rolls).toHaveLength(2)
      expect(formatted.total).toBe(result.total)
    }
  })
})

import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { formatResult, isFormattedError } from '@randsum/roller'

describe('formatResult', () => {
  test('returns total matching roll total', () => {
    const result = roll(6)
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
    if (!isFormattedError(formatted)) {
      expect(formatted.total).toBe(result.total)
    }
  })

  test('returns rolls as array of number arrays', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
    if (!isFormattedError(formatted)) {
      expect(formatted.rolls).toHaveLength(1)
      expect(formatted.rolls[0]).toHaveLength(2)
    }
  })

  test('returns description string', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
    if (!isFormattedError(formatted)) {
      expect(typeof formatted.description).toBe('string')
      expect(formatted.description.length).toBeGreaterThan(0)
    }
  })
})

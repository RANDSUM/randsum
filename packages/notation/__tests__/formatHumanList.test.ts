import { describe, expect, test } from 'bun:test'
import { formatHumanList } from '@randsum/notation'

describe('formatHumanList', () => {
  test('returns empty string for empty array', () => {
    expect(formatHumanList([])).toBe('')
  })

  test('returns single value as string', () => {
    expect(formatHumanList([5])).toBe('5')
  })

  test('joins two values with "and"', () => {
    expect(formatHumanList([1, 2])).toBe('1 and 2')
  })

  test('joins multiple values with spaces and "and" for last', () => {
    expect(formatHumanList([1, 2, 3])).toBe('1 2 and 3')
  })

  test('handles four values', () => {
    expect(formatHumanList([1, 2, 3, 4])).toBe('1 2 3 and 4')
  })
})

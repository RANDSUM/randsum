import { describe, expect, test } from 'bun:test'
import { formatComparisonNotation, parseComparisonNotation } from '../../src/notation/comparison'

describe('parseComparisonNotation — >= and <=', () => {
  test('parses >= alone', () => {
    const result = parseComparisonNotation('>=5')
    expect(result.greaterThanOrEqual).toBe(5)
  })

  test('parses <= alone', () => {
    const result = parseComparisonNotation('<=3')
    expect(result.lessThanOrEqual).toBe(3)
  })

  test('parses >= combined with other operators', () => {
    const result = parseComparisonNotation('>=5,<2')
    expect(result.greaterThanOrEqual).toBe(5)
    expect(result.lessThan).toBe(2)
  })

  test('parses <= combined with other operators', () => {
    const result = parseComparisonNotation('<=3,>1')
    expect(result.lessThanOrEqual).toBe(3)
    expect(result.greaterThan).toBe(1)
  })

  test('parses braced >= and <=', () => {
    const result = parseComparisonNotation('{>=4,<=2}')
    expect(result.greaterThanOrEqual).toBe(4)
    expect(result.lessThanOrEqual).toBe(2)
  })
})

describe('parseComparisonNotation — exact / =N', () => {
  test('parses bare integer as exact', () => {
    const result = parseComparisonNotation('5')
    expect(result.exact).toEqual([5])
  })

  test('parses =N as exact', () => {
    const result = parseComparisonNotation('=5')
    expect(result.exact).toEqual([5])
  })

  // Gap 42: =N round-trip is lossy — formatComparisonNotation emits bare integers, not =N.
  // parse("=5") -> { exact: [5] } -> format -> "5" (not "=5").
  // Both "5" and "=5" parse identically, so the round-trip is semantically lossless even
  // though the notation form changes. This is documented behavior, not a bug.
  test('=N round-trip: parse then format emits bare integer (not =N)', () => {
    const parsed = parseComparisonNotation('=5')
    const formatted = formatComparisonNotation(parsed)
    expect(formatted).toEqual(['5'])
    // Verify the re-parsed result is identical to the original parse
    expect(parseComparisonNotation(formatted[0] ?? '')).toEqual(parsed)
  })
})

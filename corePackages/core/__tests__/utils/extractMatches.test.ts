import { describe, expect, test } from 'bun:test'
import { extractMatches } from '../../src/utils/extractMatches'

describe('extractMatches', () => {
  test('extracts all matches from a string', () => {
    const input = 'This is a test string with 123 and 456 numbers'
    const pattern = /\d+/g
    const result = extractMatches(input, pattern)

    expect(result).toEqual(['123', '456'])
  })

  test('returns empty array when no matches found', () => {
    const input = 'This is a test string with no numbers'
    const pattern = /\d+/g
    const result = extractMatches(input, pattern)

    expect(result).toEqual([])
  })

  test('extracts dice notation modifiers', () => {
    const input = '2d20H+5-2'
    const highestPattern = /H/g
    const plusPattern = /\+\d+/g
    const minusPattern = /-\d+/g

    expect(extractMatches(input, highestPattern)).toEqual(['H'])
    expect(extractMatches(input, plusPattern)).toEqual(['+5'])
    expect(extractMatches(input, minusPattern)).toEqual(['-2'])
  })

  test('handles complex regex patterns', () => {
    const input = 'Roll 3d6L1 and 2d8H1'
    const dicePattern = /\d+d\d+[LH]\d+/g

    expect(extractMatches(input, dicePattern)).toEqual(['3d6L1', '2d8H1'])
  })

  test('throws error for input strings that are too long', () => {
    const longInput = 'a'.repeat(1001)
    const pattern = /a/g

    expect(() => extractMatches(longInput, pattern)).toThrow(
      'Input string too long: 1001 characters exceeds maximum of 1000'
    )
  })

  test('accepts input strings at the maximum length', () => {
    const maxLengthInput = 'a'.repeat(1000)
    const pattern = /a/g

    expect(() => extractMatches(maxLengthInput, pattern)).not.toThrow()
    expect(extractMatches(maxLengthInput, pattern)).toHaveLength(1000)
  })
})

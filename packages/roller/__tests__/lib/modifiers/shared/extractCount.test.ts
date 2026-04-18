import { describe, expect, test } from 'bun:test'
import { sumMatchCounts } from '../../../../src/modifiers/shared/extractCount'

describe('sumMatchCounts', () => {
  test('returns undefined when no matches are found', () => {
    const pattern = /\+(\d+)/g
    expect(sumMatchCounts('4d6', pattern)).toBeUndefined()
  })

  test('sums a single captured count', () => {
    const pattern = /\+(\d+)/g
    expect(sumMatchCounts('1d20+5', pattern)).toBe(5)
  })

  test('sums multiple captured counts', () => {
    const pattern = /\+(\d+)/g
    expect(sumMatchCounts('1d20+5+3+2', pattern)).toBe(10)
  })

  test('uses defaultCount when capture is missing', () => {
    const pattern = /[Hh](\d+)?/g
    expect(sumMatchCounts('4d6H', pattern, 1)).toBe(1)
  })

  test('uses defaultCount per missing capture when multiple bare modifiers appear', () => {
    const pattern = /[Hh](\d+)?/g
    expect(sumMatchCounts('4d6HH', pattern, 1)).toBe(2)
  })

  test('mixes bare and numbered captures with defaultCount', () => {
    const pattern = /[Hh](\d+)?/g
    expect(sumMatchCounts('4d6HH2', pattern, 1)).toBe(3)
  })

  test('defaults missing capture to 0 when no defaultCount provided', () => {
    const pattern = /[Hh](\d+)?/g
    expect(sumMatchCounts('4d6H3H', pattern)).toBe(3)
  })

  test('sums drop-lowest pattern correctly', () => {
    const pattern = /(?<![Kk])[Ll](\d+)?/g
    expect(sumMatchCounts('4d6L2', pattern, 1)).toBe(2)
    expect(sumMatchCounts('4d6L', pattern, 1)).toBe(1)
    expect(sumMatchCounts('4d6KL', pattern, 1)).toBeUndefined()
  })
})

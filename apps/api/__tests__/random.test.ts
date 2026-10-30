import { describe, expect, test } from 'bun:test'
import { MAX_COUNT, randomIntProblem, randomInts } from '../src/random'

/** A word source that replays `words` in order, cycling. */
function replay(words: readonly number[]): (buffer: Uint32Array) => void {
  const state = { next: 0 }
  return buffer => {
    buffer.forEach((_, i) => {
      buffer[i] = words[state.next % words.length] ?? 0
      state.next += 1
    })
  }
}

describe('randomIntProblem', () => {
  test('accepts a plain range', () => {
    expect(randomIntProblem({ min: 1, max: 6, count: 3 })).toBeUndefined()
    expect(randomIntProblem({ min: -5, max: -5, count: 1 })).toBeUndefined()
  })

  test('rejects inverted, fractional, oversized and empty requests', () => {
    expect(randomIntProblem({ min: 6, max: 1, count: 1 })).toContain('greater')
    expect(randomIntProblem({ min: 1.5, max: 6, count: 1 })).toContain('integers')
    expect(randomIntProblem({ min: 0, max: 2 ** 32, count: 1 })).toContain('span')
    expect(randomIntProblem({ min: 1, max: 6, count: 0 })).toContain('count')
    expect(randomIntProblem({ min: 1, max: 6, count: MAX_COUNT + 1 })).toContain('count')
  })
})

describe('randomInts', () => {
  test('maps words into the range', () => {
    expect(randomInts({ min: 1, max: 6, count: 3 }, replay([0, 1, 11]))).toEqual([1, 2, 6])
  })

  test('rejects the biased top of the word space and draws again', () => {
    // span 6: 2^32 % 6 === 4, so the four largest words are discarded.
    const biased = 2 ** 32 - 1
    expect(randomInts({ min: 1, max: 6, count: 2 }, replay([biased, 3, biased, 4]))).toEqual([4, 5])
  })

  test('the full 32-bit span keeps every word', () => {
    expect(randomInts({ min: 0, max: 2 ** 32 - 1, count: 1 }, replay([2 ** 32 - 1]))).toEqual([
      2 ** 32 - 1
    ])
  })

  test('crypto draws stay in range', () => {
    const values = randomInts({ min: -3, max: 3, count: MAX_COUNT })
    expect(values).toHaveLength(MAX_COUNT)
    expect(values.every(v => Number.isInteger(v) && v >= -3 && v <= 3)).toBe(true)
    expect(new Set(values).size).toBe(7)
  })
})

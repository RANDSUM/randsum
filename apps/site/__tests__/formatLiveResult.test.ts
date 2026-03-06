import { describe, expect, test } from 'bun:test'
import {
  buildCommentText,
  findDroppedIndices,
  findLastCommentIndex
} from '../src/components/rollable-code/formatLiveResult'

describe('findLastCommentIndex', () => {
  test('returns index of last // comment line', () => {
    const lines = [
      "import { roll } from '@randsum/roller'",
      '',
      "const result = roll('4d6L')",
      'console.log(result.total) // 14'
    ]
    expect(findLastCommentIndex(lines)).toBe(3)
  })

  test('returns -1 when no comment', () => {
    const lines = ["roll('4d6L')"]
    expect(findLastCommentIndex(lines)).toBe(-1)
  })

  test('returns last match when multiple comments', () => {
    const lines = ['// Roll 4d6, drop lowest', "roll('4d6L') // 1-20"]
    expect(findLastCommentIndex(lines)).toBe(1)
  })
})

describe('findDroppedIndices', () => {
  test('finds single dropped die', () => {
    const initial = [6, 5, 3, 1]
    const modified = [6, 5, 3]
    expect(findDroppedIndices(initial, modified)).toEqual(new Set([3]))
  })

  test('finds multiple dropped dice', () => {
    const initial = [6, 5, 3, 1]
    const modified = [6, 5]
    const dropped = findDroppedIndices(initial, modified)
    expect(dropped.size).toBe(2)
    expect(dropped.has(2)).toBe(true)
    expect(dropped.has(3)).toBe(true)
  })

  test('empty when no dice dropped', () => {
    const initial = [4, 5, 6]
    const modified = [4, 5, 6]
    expect(findDroppedIndices(initial, modified)).toEqual(new Set())
  })

  test('handles duplicate values — only marks extras as dropped', () => {
    const initial = [3, 3, 5, 6]
    const modified = [3, 5, 6]
    const dropped = findDroppedIndices(initial, modified)
    expect(dropped.size).toBe(1)
    expect(dropped.has(0) || dropped.has(1)).toBe(true)
  })
})

describe('buildCommentText', () => {
  test('formats simple roll with no drops', () => {
    const segments = [{ value: 14, dropped: false }]
    expect(buildCommentText(segments, 14, [])).toBe('// [14] = 14')
  })

  test('formats single roll group with drop', () => {
    const segments = [
      { value: 6, dropped: false },
      { value: 5, dropped: false },
      { value: 3, dropped: false },
      { value: 1, dropped: true }
    ]
    expect(buildCommentText(segments, 14, [])).toBe('// [6, 5, 3, 1\u0336] = 14')
  })
})

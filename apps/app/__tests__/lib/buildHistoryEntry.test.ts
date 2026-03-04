import { describe, test, expect } from 'bun:test'
import { roll } from '@randsum/roller'
import { buildHistoryEntry, getDroppedIndices } from '../../src/lib/buildHistoryEntry'

describe('getDroppedIndices', () => {
  test('returns empty array when no dice dropped', () => {
    expect(getDroppedIndices([4, 5, 6], [4, 5, 6])).toEqual([])
  })
  test('finds a single dropped die by position', () => {
    expect(getDroppedIndices([2, 5, 6], [5, 6])).toEqual([0])
  })
  test('handles duplicate values', () => {
    expect(getDroppedIndices([3, 3, 6], [3, 6])).toEqual([0])
  })
})

describe('buildHistoryEntry', () => {
  test('builds a valid HistoryEntry from a roll result', () => {
    const result = roll('1d6')
    if (result.error) throw new Error('unexpected error')
    const entry = buildHistoryEntry('1d6', result)
    expect(entry.notation).toBe('1d6')
    expect(typeof entry.total).toBe('number')
    expect(typeof entry.id).toBe('string')
    expect(typeof entry.timestamp).toBe('number')
    expect(entry.groups).toHaveLength(1)
    expect(entry.groups[0]!.initialRolls).toHaveLength(1)
  })
  test('marks dropped dice correctly for 4d6L', () => {
    const result = roll('4d6L')
    if (result.error) throw new Error('unexpected error')
    const entry = buildHistoryEntry('4d6L', result)
    const group = entry.groups[0]!
    expect(group.initialRolls).toHaveLength(4)
    expect(group.modifiedRolls).toHaveLength(3)
    expect(group.droppedIndices).toHaveLength(1)
  })
})

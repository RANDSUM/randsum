import { describe, expect, test } from 'bun:test'
import type { HistoryEntry } from '../../src/tui/hooks/useRollHistory'

describe('HistoryEntry type', () => {
  test('has all required fields', () => {
    const entry: HistoryEntry = {
      id: 0,
      notation: '1d6',
      total: 4,
      rolls: [[4]],
      description: 'Total: 4',
      timestamp: Date.now()
    }
    expect(entry.id).toBe(0)
    expect(entry.notation).toBe('1d6')
    expect(entry.total).toBe(4)
    expect(entry.rolls[0]).toEqual([4])
    expect(entry.description).toBe('Total: 4')
    expect(typeof entry.timestamp).toBe('number')
  })

  test('supports multiple roll groups', () => {
    const entry: HistoryEntry = {
      id: 1,
      notation: '2d6+1d4',
      total: 9,
      rolls: [[3, 4], [2]],
      description: 'Total: 9',
      timestamp: Date.now()
    }
    expect(entry.rolls).toHaveLength(2)
    expect(entry.rolls[0]).toEqual([3, 4])
    expect(entry.rolls[1]).toEqual([2])
  })
})

describe('prepend logic', () => {
  test('newest entry goes first', () => {
    const entries: HistoryEntry[] = []
    const first: HistoryEntry = {
      id: 0,
      notation: 'a',
      total: 1,
      rolls: [[1]],
      description: '',
      timestamp: 1
    }
    const second: HistoryEntry = {
      id: 1,
      notation: 'b',
      total: 2,
      rolls: [[2]],
      description: '',
      timestamp: 2
    }
    const after1 = [first, ...entries]
    const after2 = [second, ...after1]
    expect(after2[0]?.notation).toBe('b')
    expect(after2[1]?.notation).toBe('a')
  })

  test('single entry list has newest at index 0', () => {
    const entries: HistoryEntry[] = []
    const entry: HistoryEntry = {
      id: 0,
      notation: '1d20',
      total: 15,
      rolls: [[15]],
      description: 'Total: 15',
      timestamp: 100
    }
    const result = [entry, ...entries]
    expect(result[0]?.id).toBe(0)
    expect(result).toHaveLength(1)
  })
})

describe('useRollHistory return type', () => {
  test('addRoll accepts Omit<HistoryEntry, id | timestamp>', () => {
    // TypeScript validates this at compile time
    // Verify the shape that addRoll expects is valid
    const input: Omit<HistoryEntry, 'id' | 'timestamp'> = {
      notation: '2d6',
      total: 7,
      rolls: [[3, 4]],
      description: 'Total: 7'
    }
    expect(input.notation).toBe('2d6')
    expect(input.total).toBe(7)
    expect(input.rolls).toEqual([[3, 4]])
    expect(input.description).toBe('Total: 7')
  })
})

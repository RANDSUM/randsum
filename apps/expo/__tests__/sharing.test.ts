import { describe, expect, mock, test } from 'bun:test'

// Mock Share before importing sharing module
mock.module('react-native', () => ({
  Share: {
    share: async (_opts: { message: string; url?: string }): Promise<{ action: string }> => ({
      action: 'sharedAction'
    })
  },
  useColorScheme: () => 'dark',
  StyleSheet: {
    create: <T extends Record<string, object>>(styles: T): T => styles
  }
}))

import { formatRollResultText, shareRollResult, shareTemplate } from '../lib/sharing'
import type { ParsedRollResult } from '../lib/parseRollResult'
import type { RollTemplate } from '../lib/types'

// Minimal RollRecord shape matching @randsum/roller
function makeRecord(
  initialRolls: number[],
  rolls: number[]
): { initialRolls: number[]; rolls: number[] } {
  return { initialRolls, rolls }
}

describe('formatRollResultText', () => {
  test('formats notation, total, and dropped dice in brackets', () => {
    const result: ParsedRollResult = {
      notation: '4d6L',
      total: 15,
      records: [makeRecord([6, 5, 4, 1], [6, 5, 4]) as never]
    }
    expect(formatRollResultText(result)).toBe('Rolled 4d6L → 15 (6, 5, 4, [1])')
  })

  test('formats result with no dropped dice — no brackets', () => {
    const result: ParsedRollResult = {
      notation: '3d6',
      total: 12,
      records: [makeRecord([4, 3, 5], [4, 3, 5]) as never]
    }
    expect(formatRollResultText(result)).toBe('Rolled 3d6 → 12 (4, 3, 5)')
  })

  test('formats result with all dice dropped — all in brackets', () => {
    const result: ParsedRollResult = {
      notation: '2d6',
      total: 0,
      records: [makeRecord([3, 4], []) as never]
    }
    expect(formatRollResultText(result)).toBe('Rolled 2d6 → 0 ([3], [4])')
  })

  test('formats single die result with no breakdown when no records', () => {
    const result: ParsedRollResult = {
      notation: '1d20',
      total: 17,
      records: [makeRecord([17], [17]) as never]
    }
    expect(formatRollResultText(result)).toBe('Rolled 1d20 → 17 (17)')
  })

  test('formats result with empty records — no breakdown parens', () => {
    const result: ParsedRollResult = {
      notation: '1d6',
      total: 4,
      records: []
    }
    expect(formatRollResultText(result)).toBe('Rolled 1d6 → 4')
  })
})

describe('shareRollResult', () => {
  test('resolves without throwing', async () => {
    const result: ParsedRollResult = {
      notation: '4d6L',
      total: 15,
      records: [makeRecord([6, 5, 4, 1], [6, 5, 4]) as never]
    }
    await expect(shareRollResult(result)).resolves.toBeUndefined()
  })
})

describe('shareTemplate', () => {
  test('resolves without throwing', async () => {
    const template: RollTemplate = {
      id: 'abc123',
      name: 'Test',
      notation: '1d20',
      variables: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await expect(shareTemplate(template, 'https://randsum.io/t/abc123')).resolves.toBeUndefined()
  })
})

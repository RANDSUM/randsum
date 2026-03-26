import { describe, expect, test } from 'bun:test'
import type { ParsedRollResult } from '../lib/parseRollResult'

// Dynamic import ensures setup.ts preload mock is active before react-native resolves
const { formatRollResultText, shareRollResult } = await import('../lib/sharing')

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

  test('formats single die result', () => {
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

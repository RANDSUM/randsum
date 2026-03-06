import { describe, expect, test } from 'bun:test'
import { formatBreakdown } from '../src/components/playground/helpers/formatBreakdown'
import { type RollParams, type RollRecord, notation } from '@randsum/roller'

function makeRecord(overrides: Partial<RollRecord> = {}): RollRecord {
  return {
    argument: notation('4d6L'),
    notation: notation('4d6L'),
    description: ['4d6 drop lowest 1'],
    parameters: {
      argument: notation('4d6L'),
      notation: notation('4d6L'),
      description: ['4d6 drop lowest 1'],
      sides: 6,
      quantity: 4,
      modifiers: {},
      arithmetic: 'add',
      key: '4d6L'
    } as RollParams,
    rolls: [6, 4, 3, 1],
    modifierHistory: {
      logs: [],
      modifiedRolls: [6, 4, 3],
      total: 13,
      initialRolls: [6, 4, 3, 1]
    },
    appliedTotal: 13,
    total: 13,
    ...overrides
  }
}

describe('formatBreakdown', () => {
  test('extracts notation', () => {
    expect(formatBreakdown(makeRecord()).notation).toBe('4d6L')
  })

  test('extracts description', () => {
    expect(formatBreakdown(makeRecord()).description).toEqual(['4d6 drop lowest 1'])
  })

  test('extracts rolled dice', () => {
    expect(formatBreakdown(makeRecord()).rolled).toEqual([6, 4, 3, 1])
  })

  test('extracts kept dice', () => {
    expect(formatBreakdown(makeRecord()).kept).toEqual([6, 4, 3])
  })

  test('extracts diceTotal from modifierHistory.total', () => {
    expect(formatBreakdown(makeRecord()).diceTotal).toBe(13)
  })

  test('total equals appliedTotal when no arithmetic modifier', () => {
    expect(formatBreakdown(makeRecord()).total).toBe(13)
  })

  test('total reflects arithmetic modifier', () => {
    const breakdown = formatBreakdown(makeRecord({ appliedTotal: 16 }))
    expect(breakdown.diceTotal).toBe(13)
    expect(breakdown.total).toBe(16)
  })
})

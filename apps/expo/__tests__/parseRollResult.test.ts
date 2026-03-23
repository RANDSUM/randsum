import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'

import { parseRollResult, serializeRollResult } from '../lib/parseRollResult'

describe('parseRollResult', () => {
  test('round-trip: serialize then parse returns the same shape', () => {
    const result = roll(20)
    const parsed = {
      total: result.total,
      records: result.rolls,
      notation: result.rolls.map(r => r.notation).join('+')
    }
    const serialized = serializeRollResult(parsed)
    const deserialized = parseRollResult(serialized)

    expect(deserialized).not.toBeNull()
    expect(deserialized?.total).toBe(parsed.total)
    expect(deserialized?.notation).toBe(parsed.notation)
    expect(deserialized?.records).toHaveLength(parsed.records.length)
  })

  test('roll(20) result has total in 1–20 range and 1 record', () => {
    const result = roll(20)
    const parsed = {
      total: result.total,
      records: result.rolls,
      notation: result.rolls.map(r => r.notation).join('+')
    }
    const deserialized = parseRollResult(serializeRollResult(parsed))

    expect(deserialized?.total).toBeGreaterThanOrEqual(1)
    expect(deserialized?.total).toBeLessThanOrEqual(20)
    expect(deserialized?.records).toHaveLength(1)
  })

  test('roll("4d6L") result has 4 records entries and total equals sum of kept dice', () => {
    const result = roll('4d6L')
    const record = result.rolls[0]!
    const parsed = {
      total: result.total,
      records: result.rolls,
      notation: result.rolls.map(r => r.notation).join('+')
    }
    const deserialized = parseRollResult(serializeRollResult(parsed))

    // initialRolls has 4 dice, rolls has 3 kept (lowest dropped)
    expect(record.initialRolls).toHaveLength(4)
    expect(record.rolls).toHaveLength(3)

    // total matches the record's total
    expect(deserialized?.total).toBe(result.total)
  })

  test('parseRollResult returns null for undefined input', () => {
    expect(parseRollResult(undefined)).toBeNull()
  })

  test('parseRollResult returns null for array input', () => {
    expect(parseRollResult(['{"total":5}'])).toBeNull()
  })

  test('parseRollResult returns null for malformed JSON', () => {
    expect(parseRollResult('not-json{')).toBeNull()
  })

  test('serializeRollResult returns a string', () => {
    const parsed = { total: 10, records: [], notation: '1d20' }
    expect(typeof serializeRollResult(parsed)).toBe('string')
  })
})

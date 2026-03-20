import { describe, expect, test } from 'bun:test'
import { lookupByRange } from '../../src/lib/lookupByRange'

describe('lookupByRange', () => {
  test('matches exact single-value key', () => {
    const table = {
      '1': { label: 'One' },
      '20': { label: 'Twenty' }
    }
    expect(lookupByRange(table, 1)).toEqual({ key: '1', result: { label: 'One' } })
    expect(lookupByRange(table, 20)).toEqual({ key: '20', result: { label: 'Twenty' } })
  })

  test('matches positive range keys', () => {
    const table = {
      '1-5': { label: 'Low', value: 'low result' },
      '6-10': { label: 'Mid', value: 'mid result' },
      '11-20': { label: 'High', value: 'high result' }
    }
    expect(lookupByRange(table, 3)).toEqual({
      key: '1-5',
      result: { label: 'Low', value: 'low result' }
    })
    expect(lookupByRange(table, 6)).toEqual({
      key: '6-10',
      result: { label: 'Mid', value: 'mid result' }
    })
    expect(lookupByRange(table, 15)).toEqual({
      key: '11-20',
      result: { label: 'High', value: 'high result' }
    })
  })

  test('matches range boundaries inclusively', () => {
    const table = { '5-10': { label: 'Range' } }
    expect(lookupByRange(table, 5).key).toBe('5-10')
    expect(lookupByRange(table, 10).key).toBe('5-10')
  })

  test('matches negative single-value key', () => {
    const table = { '-3': { label: 'Negative Three' } }
    expect(lookupByRange(table, -3)).toEqual({
      key: '-3',
      result: { label: 'Negative Three' }
    })
  })

  test('matches negative-to-negative range', () => {
    const table = { '-5--1': { label: 'Deep Negative' } }
    expect(lookupByRange(table, -5)).toEqual({
      key: '-5--1',
      result: { label: 'Deep Negative' }
    })
    expect(lookupByRange(table, -3)).toEqual({
      key: '-5--1',
      result: { label: 'Deep Negative' }
    })
    expect(lookupByRange(table, -1)).toEqual({
      key: '-5--1',
      result: { label: 'Deep Negative' }
    })
  })

  test('matches negative-to-positive range', () => {
    const table = { '-2-3': { label: 'Crossing Zero' } }
    expect(lookupByRange(table, -2)).toEqual({
      key: '-2-3',
      result: { label: 'Crossing Zero' }
    })
    expect(lookupByRange(table, 0)).toEqual({
      key: '-2-3',
      result: { label: 'Crossing Zero' }
    })
    expect(lookupByRange(table, 3)).toEqual({
      key: '-2-3',
      result: { label: 'Crossing Zero' }
    })
  })

  test('skips non-range keys gracefully', () => {
    const table = {
      type: 'standard',
      '1-5': { label: 'Low' },
      '6-10': { label: 'High' }
    }
    expect(lookupByRange(table, 3)).toEqual({
      key: '1-5',
      result: { label: 'Low' }
    })
  })

  test('handles entries with missing label/value fields', () => {
    const table = { '1': { other: 'data' } }
    const result = lookupByRange(table, 1)
    expect(result.result.label).toBeUndefined()
    expect(result.result.value).toBeUndefined()
  })

  test('handles non-object entries', () => {
    const table = { '1': 'just a string' }
    const result = lookupByRange(table, 1)
    expect(result.result).toEqual({})
  })

  test('returns "No result" when no range matches', () => {
    const table = { '1-5': { label: 'Low' } }
    const result = lookupByRange(table, 99)
    expect(result.key).toBe('99')
    expect(result.result.label).toBe('No result')
  })

  test('returns "No result" for empty table', () => {
    const result = lookupByRange({}, 1)
    expect(result.key).toBe('1')
    expect(result.result.label).toBe('No result')
  })
})

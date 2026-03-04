import { describe, test, expect } from 'bun:test'
import { describeNotation } from '../../src/lib/describeNotation'

describe('describeNotation', () => {
  test('returns empty string for empty input', () => {
    expect(describeNotation('')).toBe('')
  })
  test('returns raw notation for invalid input', () => {
    expect(describeNotation('invalid')).toBe('invalid')
  })
  test('describes a basic die', () => {
    const result = describeNotation('1d6')
    expect(result).toContain('Roll 1')
    expect(result).toContain('6')
  })
  test('describes drop-lowest modifier', () => {
    const result = describeNotation('4d6L')
    expect(result).toContain('Roll 4')
    expect(result).toContain('Drop lowest')
  })
  test('describes arithmetic modifier', () => {
    const result = describeNotation('1d20+5')
    expect(result).toContain('Roll 1')
    expect(result).toContain('Add 5')
  })
  test('describes multiple groups', () => {
    const result = describeNotation('1d20+1d6')
    expect(result).toContain('Roll 1')
  })
})

import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { formatCompact, formatJson, formatVerbose } from '../../src/shared/format'

describe('formatCompact', () => {
  test('formats a simple roll', () => {
    const result = roll(6)
    const output = formatCompact(result)
    expect(output).toMatch(/^\d+\s+\[\d+]$/)
  })

  test('formats a roll with modifiers', () => {
    const result = roll('4d6L')
    const output = formatCompact(result)
    expect(output).toContain('[')
    expect(output).toContain(']')
    expect(output).toMatch(/^\d+/)
  })

  test('formats an error result', () => {
    const result = roll('zzzz')
    const output = formatCompact(result)
    expect(output).toStartWith('Error:')
  })
})

describe('formatVerbose', () => {
  test('includes roll description', () => {
    const result = roll('4d6L')
    const output = formatVerbose(result)
    expect(output).toContain('Roll:')
    expect(output).toContain('Total:')
  })

  test('shows raw and modified rolls when modifiers present', () => {
    const result = roll('4d6L')
    const output = formatVerbose(result)
    expect(output).toContain('Raw:')
  })

  test('formats an error result', () => {
    const result = roll('zzzz')
    const output = formatVerbose(result)
    expect(output).toStartWith('Error:')
  })
})

describe('formatJson', () => {
  test('returns valid JSON', () => {
    const result = roll('2d6')
    const output = formatJson(result)
    const parsed = JSON.parse(output) as Record<string, unknown>
    expect(parsed).toHaveProperty('total')
    expect(parsed).toHaveProperty('rolls')
  })

  test('includes error in JSON for invalid rolls', () => {
    const result = roll('zzzz')
    const output = formatJson(result)
    const parsed = JSON.parse(output) as Record<string, unknown>
    expect(parsed).toHaveProperty('error')
  })
})

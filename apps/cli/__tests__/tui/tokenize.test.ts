import { describe, expect, test } from 'bun:test'
import { tokenize } from '@randsum/notation/tokenize'

describe('tokenize', () => {
  test('empty string returns empty array', () => {
    expect(tokenize('')).toHaveLength(0)
  })

  test('basic notation produces core token', () => {
    const tokens = tokenize('4d6')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]?.type).toBe('core')
    expect(tokens[0]?.text).toBe('4d6')
  })

  test('notation with drop lowest produces two tokens', () => {
    const tokens = tokenize('4d6L')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.type).toBe('core')
    expect(tokens[1]?.type).toBe('dropLowest')
  })

  test('notation with plus produces arithmetic token', () => {
    const tokens = tokenize('1d20+5')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]?.type).toBe('core')
    expect(tokens[1]?.type).toBe('plus')
  })

  test('each token has start/end positions', () => {
    const tokens = tokenize('4d6L')
    expect(tokens[0]?.start).toBe(0)
    expect(tokens[0]?.end).toBe(3)
    expect(tokens[1]?.start).toBe(3)
    expect(tokens[1]?.end).toBe(4)
  })

  test('valid tokens have descriptions', () => {
    const tokens = tokenize('4d6L')
    for (const token of tokens) {
      if (token.type !== 'unknown') {
        expect(token.description.length).toBeGreaterThan(0)
      }
    }
  })
})

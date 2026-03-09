import { describe, expect, test } from 'bun:test'
import { tokenCursorIndex } from '../../src/tui/hooks/useCursorPosition'
import { tokenize } from '@randsum/notation'

describe('tokenCursorIndex', () => {
  test('returns -1 for empty tokens', () => {
    expect(tokenCursorIndex([], 0)).toBe(-1)
  })

  test('returns 0 for cursor inside first token', () => {
    const tokens = tokenize('4d6L')
    // tokens[0] is the core token '4d6', start=0 end=3
    expect(tokenCursorIndex(tokens, 0)).toBe(0) // cursor at '4'
    expect(tokenCursorIndex(tokens, 2)).toBe(0) // cursor at '6'
  })

  test('returns 1 for cursor inside second token', () => {
    const tokens = tokenize('4d6L')
    // tokens[1] is 'L', start=3 end=4
    expect(tokenCursorIndex(tokens, 3)).toBe(1)
  })

  test('returns -1 for cursor past end', () => {
    const tokens = tokenize('4d6')
    // cursor at position 3 (after the string) — not inside any token
    expect(tokenCursorIndex(tokens, 3)).toBe(-1)
  })

  test('handles cursor at start of token', () => {
    const tokens = tokenize('1d20+5')
    const plusIdx = tokens.findIndex(t => t.text.startsWith('+'))
    expect(plusIdx).toBeGreaterThan(-1)
    const plusToken = tokens[plusIdx]
    expect(plusToken).toBeDefined()
    if (plusToken === undefined) return
    expect(tokenCursorIndex(tokens, plusToken.start)).toBe(plusIdx)
  })
})

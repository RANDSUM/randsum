/**
 * Tests for URL sync helpers and copy link button logic.
 *
 * These are pure-function tests. The debounced replaceState effect and
 * clipboard write are browser-side effects not testable in bun:test.
 */
import { describe, expect, test } from 'bun:test'
import { buildNotationUrl, getCopyButtonLabel, resolveInitialNotation } from '../src/helpers/url'

describe('URL round-trip', () => {
  test('buildNotationUrl then resolveInitialNotation recovers the original notation', () => {
    const notation = '4d6L'
    const url = buildNotationUrl(notation)
    const params = new URLSearchParams(url.slice(1)) // strip leading '?'
    expect(resolveInitialNotation(params)).toBe(notation)
  })

  test('round-trip works with special characters', () => {
    const notation = '2d6+3'
    const url = buildNotationUrl(notation)
    const params = new URLSearchParams(url.slice(1))
    expect(resolveInitialNotation(params)).toBe(notation)
  })

  test('round-trip works with braces and operators', () => {
    const notation = '4d6R{<3}'
    const url = buildNotationUrl(notation)
    const params = new URLSearchParams(url.slice(1))
    expect(resolveInitialNotation(params)).toBe(notation)
  })

  test('round-trip works with percentile notation', () => {
    const notation = 'd%'
    const url = buildNotationUrl(notation)
    const params = new URLSearchParams(url.slice(1))
    expect(resolveInitialNotation(params)).toBe(notation)
  })

  test('empty notation produces empty url param and resolves to null', () => {
    const url = buildNotationUrl('')
    const params = new URLSearchParams(url.slice(1))
    expect(resolveInitialNotation(params)).toBeNull()
  })
})

describe('getCopyButtonLabel', () => {
  test('returns "Copy Link" when not copied', () => {
    expect(getCopyButtonLabel(false)).toBe('Copy Link')
  })

  test('returns "Copied!" when copied', () => {
    expect(getCopyButtonLabel(true)).toBe('Copied!')
  })
})

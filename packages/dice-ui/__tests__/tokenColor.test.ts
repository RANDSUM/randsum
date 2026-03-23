import { describe, expect, test } from 'bun:test'
import { tokenColor } from '../src/tokenColor'

describe('tokenColor', () => {
  test('returns dark color for dark theme', () => {
    expect(tokenColor({ color: '#e06c75', colorLight: '#c94c57' }, 'dark')).toBe('#e06c75')
  })

  test('returns light color for light theme', () => {
    expect(tokenColor({ color: '#e06c75', colorLight: '#c94c57' }, 'light')).toBe('#c94c57')
  })

  test('returns undefined for undefined doc', () => {
    expect(tokenColor(undefined, 'dark')).toBeUndefined()
  })
})

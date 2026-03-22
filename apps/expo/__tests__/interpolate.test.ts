import { describe, expect, test } from 'bun:test'

import { interpolateNotation } from '../lib/interpolate'

describe('interpolateNotation', () => {
  test('replaces a single variable', () => {
    expect(interpolateNotation('1d20+{mod}', { mod: 5 })).toBe('1d20+5')
  })

  test('replaces multiple variables', () => {
    expect(interpolateNotation('1d20+{mod}+{bonus}', { mod: 3, bonus: 2 })).toBe('1d20+3+2')
  })

  test('passes through notation with no variables', () => {
    expect(interpolateNotation('1d20', {})).toBe('1d20')
  })

  test('throws when a required variable is missing', () => {
    expect(() => interpolateNotation('1d20+{mod}', {})).toThrow('Missing value for variable "mod"')
  })

  test('handles zero as a valid value', () => {
    expect(interpolateNotation('1d20+{mod}', { mod: 0 })).toBe('1d20+0')
  })

  test('handles negative values', () => {
    expect(interpolateNotation('1d20+{mod}', { mod: -2 })).toBe('1d20+-2')
  })

  test('replaces same variable used multiple times', () => {
    expect(interpolateNotation('{n}d6+{n}', { n: 3 })).toBe('3d6+3')
  })
})

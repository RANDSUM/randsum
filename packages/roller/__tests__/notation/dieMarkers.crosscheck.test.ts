import { describe, expect, test } from 'bun:test'

import {
  DIE_MARKER_CUSTOM_FACES,
  DIE_MARKER_DRAW,
  DIE_MARKER_FATE,
  DIE_MARKER_GEOMETRIC,
  DIE_MARKER_PERCENTILE,
  DIE_MARKER_ZERO_BIAS
} from '../../src/notation/constants'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { tokenize } from '../../src/notation/tokenize'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'

/**
 * Cross-check that the shared special-die marker fragments in constants.ts
 * stay in sync with every consumer that composes them (isDiceNotation,
 * tokenize, notationToOptions). Each marker is exercised through all three
 * code paths so a future edit to a fragment that breaks one consumer fails
 * loudly here.
 */
const CASES = [
  { marker: DIE_MARKER_PERCENTILE, notation: '2d%', tokenKey: 'd%', dieType: 'percentile' },
  { marker: DIE_MARKER_FATE, notation: '4dF', tokenKey: 'dF', dieType: 'fate' },
  { marker: DIE_MARKER_FATE, notation: 'dF.2', tokenKey: 'dF', dieType: 'fate' },
  { marker: DIE_MARKER_CUSTOM_FACES, notation: 'd{a,b,c}', tokenKey: 'd{...}', dieType: 'custom' },
  { marker: DIE_MARKER_DRAW, notation: '3DD6', tokenKey: 'DDN', dieType: 'draw' },
  { marker: DIE_MARKER_GEOMETRIC, notation: 'g6', tokenKey: 'gN', dieType: 'geometric' },
  { marker: DIE_MARKER_ZERO_BIAS, notation: '2z8', tokenKey: 'zN', dieType: 'zeroBias' }
] as const

describe('die-type marker cross-check', () => {
  test('every marker is a non-empty raw fragment', () => {
    for (const { marker } of CASES) {
      expect(marker.length).toBeGreaterThan(0)
      // markers must not carry anchors — consumers add their own
      expect(marker.startsWith('^')).toBe(false)
      expect(marker.endsWith('$')).toBe(false)
    }
  })

  for (const { notation, tokenKey, dieType } of CASES) {
    test(`"${notation}" is recognized consistently across consumers`, () => {
      expect(isDiceNotation(notation)).toBe(true)

      expect(notationToOptions(notation)[0]?.dieType).toBe(dieType)

      const tokens = tokenize(notation)
      expect(tokens[0]?.key).toBe(tokenKey)
      // the whole notation should tokenize as the single special-die token
      expect(tokens[0]?.text).toBe(notation)
    })
  }

  test('markers compose into anchored patterns without altering match semantics', () => {
    // A quantity-prefixed marker should match the die body and nothing trails.
    const fate = new RegExp(`^(\\d*)${DIE_MARKER_FATE}$`)
    expect(fate.test('4dF')).toBe(true)
    expect(fate.test('4dF.2')).toBe(true)
    expect(fate.test('4dF.3')).toBe(false)
  })
})

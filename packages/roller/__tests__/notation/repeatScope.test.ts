import { describe, expect, test } from 'bun:test'

import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { parseNotation } from '../../src/notation/lexer/parse'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'
import { roll } from '../../src/roll'

/**
 * The repeat operator (`xN`) repeats everything to its left, so the parser (the
 * single acceptance authority) accepts it ONLY in a trailing run. A mid-stream
 * `xN` — e.g. `4d6x2+2d8` — previously lexed but was silently dropped: the `x2`
 * had no effect. That silent semantic hole is now a positioned rejection.
 *
 * Whole-string-trailing `xN` is accepted and repeats the ENTIRE expression. This
 * is a deliberate scope change from the pre-lexer engine, which scoped a trailing
 * `xN` to the last pool only. See the changeset / PR deliberate-changes list.
 */
describe('repeat operator (xN) scope', () => {
  describe('accepted: trailing repeat', () => {
    test.each([
      ['4d6Lx6'],
      ['4d6x3'],
      ['1d20X2'],
      ['2d6x2x3'],
      ['2d6+1d8x2']
    ])('isDiceNotation("%s") is true', notation => {
      expect(isDiceNotation(notation)).toBe(true)
      expect(parseNotation(notation).valid).toBe(true)
    })

    test('whole-string-trailing xN repeats the ENTIRE expression', () => {
      // `2d6+1d8x2` => (2d6 + 1d8) twice => 4 pools, not the last pool twice.
      expect(notationToOptions('2d6+1d8x2')).toHaveLength(4)
      expect(roll('2d6+1d8x2').rolls).toHaveLength(4)
    })

    test('nested trailing repeats compose', () => {
      // `2d6x2x3` => 2d6 repeated 2 then 3 => 6 pools.
      expect(roll('2d6x2x3').rolls).toHaveLength(6)
    })
  })

  describe('rejected: non-trailing repeat', () => {
    test.each([
      ['4d6x2+2d8'],
      ['4d6x2L'],
      ['1d6x2+1d6x2']
    ])('isDiceNotation("%s") is false', notation => {
      expect(isDiceNotation(notation)).toBe(false)
      expect(parseNotation(notation).valid).toBe(false)
    })

    test('parse reports the stray repeat at its position', () => {
      const result = parseNotation('4d6x2+2d8')
      expect(result.valid).toBe(false)
      // `x2` starts at index 3 in `4d6x2+2d8`.
      expect(result.error?.position).toBe(3)
      expect(result.error?.message).toContain('Repeat')
    })

    test('roll() throws rather than silently dropping a mid-stream xN', () => {
      expect(() => roll('4d6x2+2d8')).toThrow()
    })
  })
})

/**
 * Error positions are reported in the caller's coordinates, not relative to the
 * internally-trimmed string. Regression for the trim-offset nit.
 */
describe('error positions track the trim offset', () => {
  test('leading whitespace is added back to the reported position', () => {
    const result = parseNotation(' 1d20&&')
    expect(result.valid).toBe(false)
    // The `&` sits at index 5 in the ORIGINAL string (index 4 after trimming).
    expect(result.error?.position).toBe(5)
  })

  test('no offset when there is no leading whitespace', () => {
    const result = parseNotation('1d20&&')
    expect(result.error?.position).toBe(4)
  })
})

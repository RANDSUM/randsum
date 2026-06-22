import { describe, expect, test } from 'bun:test'
import fc from 'fast-check'
import { isDiceNotation, notation } from '../../src'
import { NotationParseError } from '../../src/errors'

// ReDoS / catastrophic-backtracking guard (L4 / Security R5).
//
// The notation parser is a wall of regexes applied to user-controlled strings.
// A pathological pattern (nested quantifiers, alternation overlap) could cause a
// single call to spin for milliseconds-to-seconds on a short adversarial input.
// These property tests assert BOUNDED execution: every call to the public parse
// entry points must return (or throw a NotationParseError) well under a fixed
// per-call budget, for both random and adversarial inputs.
//
// We do not assert the *result* (valid/invalid) here — only that the parser
// terminates quickly and never hangs. A regression that introduces backtracking
// would blow the budget and fail this test.

const PER_CALL_BUDGET_MS = 50

function assertBounded(input: string): void {
  const start = performance.now()
  // isDiceNotation must never throw — it is a total predicate.
  isDiceNotation(input)
  // notation() throws NotationParseError on invalid input; that is fine.
  // Anything else (a hang would not throw, but other throws are bugs).
  try {
    notation(input)
  } catch (error) {
    if (!(error instanceof NotationParseError)) {
      throw error
    }
  }
  const elapsed = performance.now() - start
  expect(elapsed).toBeLessThan(PER_CALL_BUDGET_MS)
}

// Building blocks chosen to maximize backtracking pressure: the characters that
// appear inside the notation grammar's quantified groups and alternations.
const notationAlphabet = fc.constantFrom(
  ...'0123456789dDfFgGzZuUlLhHrRoO!{}[],.<>=+-%/*xc'.split('')
)

// Adversarial seeds: long runs of grammar-significant characters that, with a
// naive regex, could trigger exponential backtracking.
const adversarialSeeds: readonly string[] = [
  'd'.repeat(500),
  '1'.repeat(500),
  '1d6'.repeat(200),
  '{'.repeat(500),
  '}'.repeat(500),
  '{'.repeat(250) + '}'.repeat(250),
  '['.repeat(500),
  '1d6R{'.repeat(100),
  '+'.repeat(500),
  '-'.repeat(500),
  '1d6!'.repeat(200),
  'd{'.repeat(200),
  ('1d6+' as string).repeat(200),
  '<'.repeat(500),
  '>'.repeat(500),
  '1d6R{<' + '9'.repeat(400) + '}',
  '9'.repeat(900),
  '1d' + '9'.repeat(400) + 'L'.repeat(400)
]

describe('notation ReDoS / bounded-execution property tests', () => {
  test('isDiceNotation and notation() terminate quickly on random strings', () => {
    fc.assert(
      fc.property(fc.string({ unit: notationAlphabet, minLength: 0, maxLength: 1000 }), input => {
        assertBounded(input)
        return true
      }),
      { numRuns: 2000 }
    )
  })

  test('isDiceNotation and notation() terminate quickly on arbitrary unicode strings', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 1000 }), input => {
        assertBounded(input)
        return true
      }),
      { numRuns: 1000 }
    )
  })

  test('isDiceNotation and notation() terminate quickly on adversarial seeds', () => {
    for (const seed of adversarialSeeds) {
      assertBounded(seed)
    }
  })

  test('repeated grammar tokens do not cause superlinear blowup', () => {
    // Compare a short and a long pathological input. If backtracking is present,
    // the long input's time grows superlinearly. We assert both stay within the
    // absolute per-call budget, which is the meaningful safety property.
    const short = '1d6R{<3}'.repeat(10)
    const long = '1d6R{<3}'.repeat(300)
    assertBounded(short)
    assertBounded(long)
  })
})

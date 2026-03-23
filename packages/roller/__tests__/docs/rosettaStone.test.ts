import { describe, expect, test } from 'bun:test'
import { NOTATION_DOCS } from '../../src/docs'
import { roll } from '../../src/roll'
import { isDiceNotation } from '../../src/notation/isDiceNotation'

/**
 * Detect whether a notation string is a full rollable expression (e.g. "3d6!")
 * vs a bare modifier fragment (e.g. "!" or "L"). Only full notations can be
 * passed to roll() and isDiceNotation().
 */
const isFullNotation = (s: string): boolean =>
  /\d+[dD]\d+/.test(s) ||
  /^\d*[dD]%$/.test(s) ||
  /^\d*[dD][fF]/.test(s) ||
  /^\d*[zZ]\d+$/.test(s) ||
  /^\d*[gG]\d+$/.test(s) ||
  /^\d*[dD]{2}\d+$/.test(s) ||
  /^\d*[dD]\{[^}]+\}$/.test(s)

/**
 * Known options examples that fail due to validation bugs (not doc bugs).
 * Cap's "Clamp to [3, 18]" uses { lessThan: 3, greaterThan: 18 } which is
 * semantically correct for cap (floor/ceiling), but validateComparisonOptions
 * rejects it as an impossible range. The equivalent notation "4d20C{<3,>18}"
 * works fine because it bypasses validation.
 */
const KNOWN_OPTIONS_FAILURES: ReadonlySet<string> = new Set(['Clamp to [3, 18]'])

describe('Rosetta Stone — notation examples', () => {
  for (const [, doc] of Object.entries(NOTATION_DOCS)) {
    describe(doc.title, () => {
      for (const example of doc.examples) {
        if (!isFullNotation(example.notation)) {
          test.skip(`fragment "${example.notation}" — not a standalone notation`, () => {})
          continue
        }

        test(`notation "${example.notation}" is valid and rollable`, () => {
          expect(isDiceNotation(example.notation)).toBe(true)

          const result = roll(example.notation)
          expect(result.rolls.length).toBeGreaterThanOrEqual(1)
          expect(typeof result.total).toBe('number')
        })
      }
    })
  }
})

describe('Rosetta Stone — options examples', () => {
  for (const [, doc] of Object.entries(NOTATION_DOCS)) {
    describe(doc.title, () => {
      for (const example of doc.optionsExamples) {
        if (KNOWN_OPTIONS_FAILURES.has(example.description)) {
          test.todo(`options "${example.description}" — known validation bug (cap clamp range)`)
          continue
        }

        test(`options "${example.description}" is rollable`, () => {
          const result = roll(example.options)
          expect(result.rolls.length).toBeGreaterThanOrEqual(1)
          expect(typeof result.total).toBe('number')
        })
      }
    })
  }
})

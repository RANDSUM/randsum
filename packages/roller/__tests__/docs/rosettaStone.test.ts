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

describe('Rosetta Stone — notation examples', () => {
  for (const [, doc] of Object.entries(NOTATION_DOCS)) {
    describe(doc.title, () => {
      for (const example of doc.examples) {
        if (!isFullNotation(example.notation)) {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
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

describe('Cap — floor/ceiling clamp range (S3 regression)', () => {
  test('cap { lessThan: 3, greaterThan: 18 } validates and rolls without throwing', () => {
    expect(() => {
      const result = roll({
        sides: 20,
        quantity: 4,
        modifiers: { cap: { lessThan: 3, greaterThan: 18 } }
      })
      expect(result.rolls.length).toBeGreaterThanOrEqual(1)
      expect(typeof result.total).toBe('number')
    }).not.toThrow()
  })
})

describe('Rosetta Stone — options examples', () => {
  for (const [, doc] of Object.entries(NOTATION_DOCS)) {
    describe(doc.title, () => {
      for (const example of doc.examples) {
        if (example.options === undefined) continue

        test(`options "${example.description}" is rollable`, () => {
          const result = roll(example.options!)
          expect(result.rolls.length).toBeGreaterThanOrEqual(1)
          expect(typeof result.total).toBe('number')
        })
      }
    })
  }
})

import { describe, expect, test } from 'bun:test'
import { NOTATION_DOCS } from '../../src/docs'
import { tokenize } from '../../src/notation/tokenize'

// The token overlay looks every token up in NOTATION_DOCS by key and paints a miss
// as an error. A lexer key with no doc entry turns valid notation red, which is how
// the default `4d6L` demo shipped with `L` in the error colour.
const notations = [
  '4d6L',
  '4d6L2',
  '2d20H',
  '4d6D{<2}',
  '3d6!s{1,6}',
  '1d4!i',
  '1d20!r',
  '2d6+3[fire]',
  '4d6Lx6',
  ...Object.values(NOTATION_DOCS).flatMap(doc => doc.examples.map(example => example.notation))
]

describe('tokenize keys resolve to NOTATION_DOCS', () => {
  for (const notation of notations) {
    test(notation, () => {
      const missing = tokenize(notation)
        .filter(token => token.category !== 'unknown')
        .map(token => token.key)
        .filter(key => NOTATION_DOCS[key] === undefined)
      expect(missing).toEqual([])
    })
  }

  test('drop tokens carry the documented L / H / D{..} key', () => {
    expect(tokenize('4d6L')[1]?.key).toBe('L')
    expect(tokenize('4d6H2')[1]?.key).toBe('H')
    expect(tokenize('4d6D{1,2}')[1]?.key).toBe('D{..}')
  })
})

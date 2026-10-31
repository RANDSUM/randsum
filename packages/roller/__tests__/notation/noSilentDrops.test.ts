import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { notationToOptions } from '../../src/notation/parse/notationToOptions'

// RDN §8.3 and §9.5: an implementation MUST NOT silently discard part of the
// notation. Each of these used to parse with one token's meaning thrown away.
describe('notation the parser would otherwise drop part of', () => {
  test.each([
    ['2d6*2*3', 'a second multiply'],
    ['4d6V{1=6}V{2=6}', 'a second replace'],
    ['2d6C{>5}C{<2}', 'a second cap'],
    ['4d6D{1}D{2}', 'a second conditional drop'],
    ['4d6R{1}R{2}', 'a second reroll'],
    ['4d6ro{1}R{2}', 'a reroll after reroll-once'],
    ['4d6!s{8}!s{10}', 'a second explode sequence'],
    ['4d6!i!r', 'inflation and reduction together'],
    ['4d6!!3!!2', 'a second compound depth'],
    ['4d6!{1}!{2}', 'a second explode condition'],
    ['4d6//2//3', 'a second integer divide'],
    ['4d6%3%2', 'a second modulo'],
    ['4d6**2**3', 'a second multiply total'],
    ['4d6sasd', 'two sort directions'],
    ['4d6KK', 'a second keep'],
    ['4d6U{1}U', 'a second unique'],
    ['2d6[a][b]', 'a second annotation'],
    ['4d6!!2{>4}', 'a compound depth beside a condition'],
    ['4d6!p2{>4}', 'a penetrate depth beside a condition'],
    ['2d6!s{0}', 'a zero-sided die in a sequence'],
    ['2d6!s{4,0}', 'a zero-sided die later in a sequence'],
    ['2d{a,}', 'an empty custom face'],
    ['2d{a, }', 'a blank custom face']
  ])('%s is rejected (%s)', notation => {
    expect(isDiceNotation(notation)).toBe(false)
    expect(() => notationToOptions(notation)).toThrow()
  })

  test.each([
    ['2d6+3+2', { plus: 5 }],
    ['1d20ms{5}ms{2}', { minus: 7 }],
    ['4d6LL', { drop: { lowest: 2 } }],
    ['4d6!L!', { explode: true, drop: { lowest: 1 } }],
    ['4d6KKm', { keep: { highest: 1 }, drop: { lowest: 1, highest: 1 } }],
    ['4d6!!{>4}', { compound: { greaterThan: 4 } }],
    ['4d6!!3', { compound: 3 }]
  ])('%s still parses: repeats that sum, flags and single forms', (notation, modifiers) => {
    expect(notationToOptions(notation)[0]?.modifiers).toEqual(modifiers)
  })
})

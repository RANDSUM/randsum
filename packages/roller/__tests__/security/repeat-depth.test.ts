import { describe, expect, test } from 'bun:test'

import { roll } from '../../src/roll'
import { NotationParseError } from '../../src/errors'
import { MAX_REPEAT_COUNT, MAX_REPEAT_DEPTH } from '../../src/notation/parse/notationToOptions'

describe('security: repeat operator bounds', () => {
  test(`repeat count at MAX_REPEAT_COUNT (${MAX_REPEAT_COUNT}) is permitted`, () => {
    expect(() => roll(`1d6x${MAX_REPEAT_COUNT}` as string)).not.toThrow()
  })

  test('repeat bomb roll("1d6x1000000") throws NotationParseError with count + cap', () => {
    try {
      roll('1d6x1000000' as string)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(NotationParseError)
      const err = e as NotationParseError
      expect(err.message).toContain('1000000')
      expect(err.message).toContain(String(MAX_REPEAT_COUNT))
    }
  })

  test('repeat count just over cap throws NotationParseError', () => {
    const attempted = MAX_REPEAT_COUNT + 1
    expect(() => roll(`1d6x${attempted}` as string)).toThrow(NotationParseError)
  })

  test('nested repeat exceeding MAX_REPEAT_DEPTH throws NotationParseError', () => {
    // 11 chained x2 operators -> depth 11 > MAX_REPEAT_DEPTH (10)
    const nested = '1d6' + 'x2'.repeat(MAX_REPEAT_DEPTH + 1)
    try {
      roll(nested)
      throw new Error('expected throw')
    } catch (e) {
      expect(e).toBeInstanceOf(NotationParseError)
      const err = e as NotationParseError
      expect(err.message).toContain(String(MAX_REPEAT_DEPTH))
    }
  })

  test('nested repeat chain from task spec throws NotationParseError', () => {
    // 11 chained x100 — each count is under MAX_REPEAT_COUNT but depth exceeds limit
    expect(() => roll('1d6x100x100x100x100x100x100x100x100x100x100x100' as string)).toThrow(
      NotationParseError
    )
  })
})

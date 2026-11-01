import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/roll'
import type { DiceNotation } from '../../src/types'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

const ITERATIONS = 500

describe('unique with exempt values (spec 6.5.3)', () => {
  test.each(['3d2U{1}', '7d6U{1}', '4d6U{1}'])(
    '%s always rolls: the exempt value may repeat',
    notation => {
      const randomFn = createSeededRandom(42)
      Array.from({ length: ITERATIONS }).forEach(() => {
        const pool = roll(notation, { randomFn }).rolls[0]?.rolls ?? []
        const repeated = pool.filter((value, i) => pool.indexOf(value) !== i)
        expect(repeated.every(value => value === 1)).toBe(true)
      })
    }
  )

  test('the options form behaves like the notation form', () => {
    const result = roll({ sides: 2, quantity: 3, modifiers: { unique: { notUnique: [1] } } })
    expect(result.rolls[0]?.rolls).toHaveLength(3)
  })

  test('7d6U is rejected: six faces cannot make seven unique values', () => {
    expect(() => roll('7d6U')).toThrow('Cannot have 7 unique values with only 6 sides')
  })

  test('an exempt value the die cannot show does not lift the limit', () => {
    expect(() => roll('7d6U{7}')).toThrow('Cannot have 7 unique values with only 6 sides')
  })

  test('custom faces count distinct faces, not sides', () => {
    expect(() => roll('3d{1,1,2}U' as DiceNotation)).toThrow(
      'Cannot have 3 unique values with only 2 distinct faces'
    )
    expect(roll('2d{1,1,2}U' as DiceNotation).rolls[0]?.rolls.toSorted()).toEqual([1, 2])
  })
})

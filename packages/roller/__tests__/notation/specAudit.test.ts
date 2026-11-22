// Behaviour the RDN 0.9.0 rev. 6 audit pinned down: each case is a place where
// the roller and the specification disagreed, or where the roller dropped part
// of the notation without a word.
import { describe, expect, test } from 'bun:test'
import { isDiceNotation, roll } from '../../src'
import { ModifierError, RollError } from '../../src/errors'
import { createQueueRandom } from '../../src/random'
import { validateNotation } from '../../src/validate'
import type { RollArgument } from '../../src/types'

function pool(
  notation: RollArgument,
  rolls: number[],
  extra: Partial<Parameters<typeof createQueueRandom>[0]> = {}
): number[] {
  const result = roll(notation, { randomFn: createQueueRandom({ sides: 6, rolls, ...extra }) })
  return result.rolls[0]?.rolls ?? []
}

describe('drop and keep leave the survivors in pool order', () => {
  test('L does not sort the pool, so it agrees with its alias K', () => {
    expect(pool('4d6L', [6, 1, 3, 2])).toEqual([6, 3, 2])
    expect(pool('4d6K3', [6, 1, 3, 2])).toEqual([6, 3, 2])
    expect(pool('4d6LL', [6, 1, 3, 2])).toEqual([6, 3])
  })

  test('among equal values the earliest die is removed', () => {
    expect(pool('3d6L', [1, 5, 1])).toEqual([5, 1])
    expect(pool('3d6H', [5, 1, 5])).toEqual([1, 5])
    expect(pool('3d6kl2', [5, 1, 5])).toEqual([1, 5])
    expect(pool('3d6K2', [1, 5, 1])).toEqual([5, 1])
    expect(pool('4d6LH', [3, 3, 3, 3])).toEqual([3, 3])
  })
})

describe('notation the grammar forbids is rejected, not half-read', () => {
  test.each([
    '4d6ro{1}2',
    '4d6R{1}0',
    '4d6K2kl',
    '4d6klK2',
    'z0',
    'g0',
    'DD0',
    'z06',
    '4d6U{a}',
    '4d6U{>1}',
    '4d6U{1,}',
    '4d6!s{,}',
    '4d6!s{4,}',
    '4d6!s{0}',
    '4d6KM0',
    '4d6K03',
    '4d6!!p',
    '4d6!!S{3}',
    `1d6*${'9'.repeat(40)}`,
    '2d6S{3}F{2}'
  ])('%s', notation => {
    expect(isDiceNotation(notation)).toBe(false)
  })

  test('keep highest and keep lowest cannot share an options object', () => {
    expect(() =>
      roll({ sides: 6, quantity: 4, modifiers: { keep: { highest: 1, lowest: 1 } } })
    ).toThrow()
  })

  test('repeats are limited by their product', () => {
    expect(validateNotation('1d6x1000').valid).toBe(true)
    expect(validateNotation('1d6x1000x2').valid).toBe(false)
  })
})

describe('longest match, left to right (RDN 8.3, P3)', () => {
  test.each(['4d6!!!', '4d6!sa', '4d6!p!', '4d6!s{4}!'])('%s parses', notation => {
    expect(isDiceNotation(notation)).toBe(true)
  })

  test('!!! is Compound then Explode', () => {
    const result = validateNotation('4d6!!!')
    expect(result.valid && result.options[0]?.modifiers).toEqual({ compound: true, explode: true })
  })

  test('every explosion form set together renders notation that reads back', () => {
    const modifiers = { explode: true, compound: true, penetrate: true, explodeSequence: [8] }
    const [record] = roll({ sides: 6, quantity: 4, modifiers }).rolls
    const reread = validateNotation(record?.notation ?? '')
    expect(reread.valid && reread.options[0]?.modifiers).toEqual(modifiers)
  })
})

describe('condition lists are alternatives', () => {
  test('an operator written twice keeps the bound that matches more', () => {
    expect(pool('4d6D{>2,>4}', [3, 4, 5, 6])).toEqual([])
    expect(pool('4d6D{>4,>2}', [3, 4, 5, 6])).toEqual([])
    expect(pool('4d6D{<3,<5}', [1, 4, 5, 6])).toEqual([5, 6])
  })

  test('reroll low or high is valid', () => {
    expect(pool('4d6R{<2,>5}', [1, 6, 3, 4], { rerollRolls: [3, 2] })).toEqual([3, 2, 3, 4])
  })
})

describe('count is once per pool, not once per notation', () => {
  test('2d6S{3}+2d6S{3}', () => {
    expect(isDiceNotation('2d6S{3}+2d6S{3}')).toBe(true)
  })
})

describe('reroll limit counts dice rerolled', () => {
  test('once with max 1 rerolls one die even when it lands on the same value', () => {
    const rolls = pool(
      { sides: 6, quantity: 4, modifiers: { reroll: { once: true, max: 1, exact: [1] } } },
      [1, 1, 3, 4],
      { rerollRolls: [1, 2] }
    )
    expect(rolls).toEqual([1, 1, 3, 4])
  })
})

describe('unique examines the last allowed reroll', () => {
  test('a unique value on the final attempt is kept', () => {
    const rerollRolls = [...Array.from({ length: 98 }, () => 1), 2]
    expect(pool('2d6U', [1, 1], { rerollRolls })).toEqual([1, 2])
  })
})

describe('left-over audit items', () => {
  test.each([
    ['z6', ['1z6']],
    ['g6+1', ['1g6+1']],
    ['3dd6', ['3DD6']],
    ['4dF+1', ['4dF+1']],
    ['dF.2', ['1dF.2']],
    ['d{a,b}', ['1d{a,b}']],
    ['3d{1,1,2}L', ['3d{1,1,2}L']],
    ['2d6+3[fire]', ['2d6+3[fire]']],
    ['1d20+5[a]+2d6[b]', ['1d20+5[a]', '2d6[b]']]
  ])('validateNotation("%s") echoes notation that rolls the same die', (notation, echoed) => {
    const result = validateNotation(notation)
    if (!result.valid) throw new Error(`${notation} should be valid`)
    expect(result.notation.map(String)).toEqual(echoed)
    const again = result.notation.map(n => validateNotation(n))
    expect(again.map(r => (r.valid ? r.options[0] : null))).toEqual(result.options)
  })

  test('a total too large to represent exactly is an error, not a rounded number', () => {
    expect(() => roll('2d6*9007199254740991')).toThrow(RollError)
    expect(roll('2d6*2').total).toBeGreaterThan(0)
  })

  test.each([
    '5d10S{7,7}',
    '5d10#{>=7,<=7}',
    '5d10#{>=3,<8}',
    '5d10#{>6,<=7}',
    '5d10#{=2,>=9,<=2}'
  ])('Count rejects %s: a die would be both a success and a failure', notation => {
    expect(() => roll(notation)).toThrow(ModifierError)
  })

  test.each(['5d10S{7,2}', '5d10#{>7,<8}', '5d10#{=7,>=9,<=2}'])(
    'Count accepts %s: no value is both',
    notation => {
      expect(() => roll(notation)).not.toThrow()
    }
  )

  test('Cap describes >= and <= as the clamp they are', () => {
    expect(validateNotation('4d6C{>=5,<=2}')).toMatchObject({
      description: [['Roll 4 6-sided dice', 'No Rolls greater than 5', 'No Rolls less than 2']]
    })
  })
})

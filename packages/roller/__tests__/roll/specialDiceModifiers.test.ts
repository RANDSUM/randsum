import { describe, expect, test } from 'bun:test'
import { isDiceNotation, roll, validateNotation } from '../../src'
import { ModifierError } from '../../src/errors'
import type { DiceNotation } from '../../src/notation/types'

// The DiceNotation template type only spells NdS pools, so special dice with
// modifiers reach roll() the way runtime strings do: through a cast.
const n = (notation: string): DiceNotation => notation as DiceNotation

// Always picks the highest face / index.
const top = { randomFn: (): number => 0.999 }

describe('modifiers on special dice', () => {
  test.each([
    ['4dF+1', 5, '4dF+1'],
    ['4dF-1', 3, '4dF-1'],
    ['dF.2+1', 3, '1dF.2+1'],
    ['d%+5', 105, '1d100+5'],
    ['2d%+3', 203, '2d100+3'],
    ['z6+1', 6, 'z6+1'],
    ['2d{1,2,3}+1', 7, '2d{1,2,3}+1'],
    ['4dFL', 3, '4dFL'],
    ['1d6+4dF+1', 11, '4dF+1']
  ])('roll("%s") applies its modifiers', (notation, total, poolNotation) => {
    expect(isDiceNotation(notation)).toBe(true)
    const result = roll(n(notation), top)
    expect(result.total).toBe(total)
    expect(result.rolls.map(r => String(r.notation))).toContain(poolNotation)
  })

  test('3DD6L drops the lowest drawn value', () => {
    const result = roll(n('3DD6L'))
    expect(result.rolls[0]?.initialRolls).toHaveLength(3)
    expect(result.rolls[0]?.rolls).toHaveLength(2)
    expect(new Set(result.rolls[0]?.initialRolls).size).toBe(3)
    expect(String(result.rolls[0]?.notation)).toBe('3DD6L')
  })

  test('g6+1 adds to the geometric sum', () => {
    const result = roll(n('g6+1'), { randomFn: () => 0 })
    expect(result.total).toBe(2)
    expect(String(result.rolls[0]?.notation)).toBe('g6+1')
  })

  test('a conditional explode works on a Fate die', () => {
    const result = roll(n('1dF!{>0}'), {
      randomFn: ((): (() => number) => {
        const values = [0.999, 0]
        return () => values.shift() ?? 0
      })()
    })
    expect(result.rolls[0]?.rolls).toEqual([1, -1])
  })

  test.each(['4dF+1', 'd%+5', 'g6+1', 'z6+1', '3DD6L', '2d{1,2,3}+1', '3d{a,b,c}L'])(
    'validateNotation("%s") is valid and does not throw',
    notation => {
      const result = validateNotation(notation)
      if (!result.valid) throw new Error(`expected "${notation}" to be valid`)
      expect(result.description[0]?.length).toBeGreaterThan(1)
    }
  )

  test('validateNotation describes the special core and its modifiers', () => {
    const result = validateNotation('4dF+1')
    if (!result.valid) throw new Error('expected "4dF+1" to be valid')
    expect(result.description).toEqual([['Roll 4dF', 'Add 1']])
  })
})

describe('modifiers are validated on the notation path', () => {
  test.each([
    ['1d6L', { sides: 6, quantity: 1, modifiers: { drop: { lowest: 1 } } }],
    ['4d6L4', { sides: 6, quantity: 4, modifiers: { drop: { lowest: 4 } } }],
    ['3d6K5', { sides: 6, quantity: 3, modifiers: { keep: { highest: 5 } } }]
  ] as const)('roll("%s") throws like its options form', (notation, options) => {
    expect(() => roll(options)).toThrow(ModifierError)
    expect(() => roll(notation)).toThrow(ModifierError)
  })

  test('4dFU throws: four unique values from three faces', () => {
    expect(() => roll(n('4dFU'))).toThrow(ModifierError)
  })
})

describe('reroll values are checked against the die faces', () => {
  // The first draw lands on the named face; every later draw uses `rest`.
  test.each([
    ['z6R{0}', 0, 0.999, 0, 5],
    ['dF.2R{0}', 0.5, 0.999, 0, 2],
    ['3d{2,4,6}R{6}', 0.999, 0, 6, 2],
    ['3d{2,4,6}ro{6}', 0.999, 0, 6, 2]
  ])('roll("%s") rerolls a face outside [1..N]', (notation, first, rest, face, replacement) => {
    expect(isDiceNotation(notation)).toBe(true)
    expect(validateNotation(notation).valid).toBe(true)
    const values = [first]
    const result = roll(n(notation), { randomFn: () => values.shift() ?? rest })
    expect(result.rolls[0]?.initialRolls[0]).toBe(face)
    expect(result.rolls[0]?.rolls[0]).toBe(replacement)
  })

  test.each(['z6R{9}', 'z6R{6}', 'dFR{2}', '3d{2,4,6}R{1}'])(
    'roll("%s") throws: the value is not a face of the die',
    notation => {
      expect(() => roll(n(notation))).toThrow(ModifierError)
    }
  )
})

describe('zero divisors', () => {
  test.each(['2d6//0', '2d6%0', '1d6//00'])('"%s" is not notation', notation => {
    expect(isDiceNotation(notation)).toBe(false)
    expect(() => roll(n(notation))).toThrow()
  })

  test.each([['integerDivide'], ['modulo']] as const)(
    'options { %s: 0 } throws ModifierError instead of returning NaN',
    name => {
      expect(() => roll({ sides: 6, quantity: 2, modifiers: { [name]: 0 } })).toThrow(ModifierError)
    }
  )
})

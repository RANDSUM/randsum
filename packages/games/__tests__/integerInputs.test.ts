import { describe, expect, test } from 'bun:test'
import { roll as blades } from '@randsum/games/blades'
import { roll as daggerheart } from '@randsum/games/daggerheart'
import { roll as fate } from '@randsum/games/fate'
import { roll as fifth } from '@randsum/games/fifth'
import { roll as pbta } from '@randsum/games/pbta'
import { roll as rootRpg } from '@randsum/games/root-rpg'

// `type: integer` inputs must reject fractions up front, with the game's own
// label, instead of rolling a fractional total or failing deep in the roller.
describe('integer inputs reject fractions', () => {
  test('blades rating', () => {
    expect(() => blades({ rating: 2.5 })).toThrow('must be an integer, received: 2.5')
  })

  test('daggerheart modifier', () => {
    expect(() => daggerheart({ modifier: 0.5 })).toThrow(
      'Daggerheart modifier must be an integer, received: 0.5'
    )
  })

  test('fate modifier', () => {
    expect(() => fate({ modifier: 1.5 })).toThrow('must be an integer, received: 1.5')
  })

  test('fifth modifier', () => {
    expect(() => fifth({ modifier: 1.5 })).toThrow('5E modifier must be an integer, received: 1.5')
  })

  test('pbta stat, forward and ongoing', () => {
    expect(() => pbta({ stat: 1.5 })).toThrow('stat must be an integer, received: 1.5')
    expect(() => pbta({ stat: 1, forward: 0.5 })).toThrow('forward must be an integer')
    expect(() => pbta({ stat: 1, ongoing: 0.5 })).toThrow('ongoing must be an integer')
  })

  test('root-rpg bonus', () => {
    expect(() => rootRpg({ bonus: 1.5 })).toThrow(
      'Root RPG bonus must be an integer, received: 1.5'
    )
  })
})

// Untyped callers (JSON bodies, plain JS) can pass a string or leave a required
// input out. Both must be rejected, not concatenated into the notation or
// turned into NaN.
describe('integer inputs reject missing and non-number values', () => {
  const untyped = <T>(value: unknown): T => value as T

  test('a missing required input is rejected', () => {
    expect(() => pbta(untyped<Parameters<typeof pbta>[0]>({}))).toThrow(
      'stat must be a finite number, received: undefined'
    )
    expect(() => rootRpg(untyped<Parameters<typeof rootRpg>[0]>({}))).toThrow(
      'bonus must be a finite number, received: undefined'
    )
  })

  test('a string for a required or optional input is rejected', () => {
    expect(() => pbta(untyped<Parameters<typeof pbta>[0]>({ stat: '3' }))).toThrow(
      'stat must be a finite number'
    )
    expect(() => pbta(untyped<Parameters<typeof pbta>[0]>({ stat: 1, forward: '2' }))).toThrow(
      'forward must be a finite number'
    )
    expect(() => blades(untyped<Parameters<typeof blades>[0]>({ rating: '2' }))).toThrow(
      'must be a finite number'
    )
  })
})

describe('roll() rejects a bare value where it takes an input object', () => {
  const untyped = <T>(value: unknown): T => value as T

  test('root-rpg roll(2) throws instead of dropping the bonus', () => {
    expect(() => rootRpg(untyped<Parameters<typeof rootRpg>[0]>(2))).toThrow(
      'Root RPG roll() takes an input object, received: 2'
    )
  })

  test('blades accepts a number but not a string', () => {
    expect(() => blades(untyped<Parameters<typeof blades>[0]>('3'))).toThrow(
      'takes a number or an input object, received: 3'
    )
  })
})

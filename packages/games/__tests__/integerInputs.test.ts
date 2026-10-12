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

import { describe, expect, test } from 'bun:test'
import { roll as bladesRoll } from '@randsum/games/blades'
import { roll as daggerheartRoll } from '@randsum/games/daggerheart'
import { roll as fifthRoll } from '@randsum/games/fifth'
import { roll as pbtaRoll } from '@randsum/games/pbta'
import { roll as rootRoll } from '@randsum/games/root-rpg'
import { roll as salvageunionRoll } from '@randsum/games/salvageunion'

describe('game subpath smoke tests', () => {
  test('blades: roll returns result, total, and rolls', () => {
    const outcome = bladesRoll({ rating: 2 })

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })

  test('blades: default roll (no args) works', () => {
    const outcome = bladesRoll()

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
  })

  test('fifth: roll returns result, total, and rolls', () => {
    const outcome = fifthRoll({ modifier: 3 })

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })

  test('daggerheart: roll returns result, total, and rolls', () => {
    const outcome = daggerheartRoll({})

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })

  test('pbta: roll returns result, total, and rolls', () => {
    const outcome = pbtaRoll({ stat: 1 })

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })

  test('root-rpg: roll returns result, total, and rolls', () => {
    const outcome = rootRoll(0)

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })

  test('salvageunion: roll returns result, total, and rolls', () => {
    const outcome = salvageunionRoll('Core Mechanic')

    expect(outcome.result).toBeDefined()
    expect(typeof outcome.total).toBe('number')
    expect(Array.isArray(outcome.rolls)).toBe(true)
    expect(outcome.rolls.length).toBeGreaterThan(0)
  })
})

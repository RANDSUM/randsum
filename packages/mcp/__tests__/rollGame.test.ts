import { describe, expect, test } from 'bun:test'
import { AVAILABLE_GAMES, rollGame } from '../src/tools/rollGame'

describe('rollGame', () => {
  test('exposes the full game list', () => {
    expect(AVAILABLE_GAMES).toContain('blades')
    expect(AVAILABLE_GAMES).toContain('daggerheart')
    expect(AVAILABLE_GAMES).toContain('salvageunion')
    expect(AVAILABLE_GAMES).toHaveLength(7)
  })

  test('rolls fate with a modifier', () => {
    const result = rollGame('fate', { modifier: 1 })
    expect(result.game).toBe('fate')
    expect(typeof result.result).toBe('string')
    expect(Array.isArray(result.rolls)).toBe(true)
    expect(result.rolls.length).toBeGreaterThan(0)
  })

  test('rolls blades with a rating', () => {
    const result = rollGame('blades', { rating: 2 })
    expect(result.game).toBe('blades')
    expect(typeof result.result).toBe('string')
  })

  test('rolls daggerheart and surfaces details', () => {
    const result = rollGame('daggerheart', { modifier: 2 })
    expect(result.game).toBe('daggerheart')
    expect(result.details).toBeDefined()
  })

  test('rolls fifth with advantage', () => {
    const result = rollGame('fifth', { modifier: 3, rollingWith: 'Advantage' })
    expect(result.game).toBe('fifth')
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  test('rolls salvageunion on a named table', () => {
    const result = rollGame('salvageunion', { tableName: 'Core Mechanic' })
    expect(result.game).toBe('salvageunion')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
  })

  test('requires stat for pbta', () => {
    expect(() => rollGame('pbta', {})).toThrow(/requires params\.stat/)
  })

  test('rolls pbta when stat is provided', () => {
    const result = rollGame('pbta', { stat: 2, forward: 1 })
    expect(result.game).toBe('pbta')
    expect(typeof result.result).toBe('string')
  })

  test('requires bonus for root-rpg', () => {
    expect(() => rollGame('root-rpg', {})).toThrow(/requires params\.bonus/)
  })

  test('rolls root-rpg when bonus is provided', () => {
    const result = rollGame('root-rpg', { bonus: 1 })
    expect(result.game).toBe('root-rpg')
    expect(typeof result.result).toBe('string')
  })
})

import { describe, expect, test } from 'bun:test'

import { AVAILABLE_GAMES } from '@randsum/games'

import { GAME_CONFIG, GAME_LIST } from '../lib/gameConfig'
import { GAME_INPUT_SPECS } from '../lib/gameInputSpecs'

describe('Game config', () => {
  test('GAME_CONFIG has all 6 games', () => {
    expect(Object.keys(GAME_CONFIG)).toHaveLength(6)
    expect(Object.keys(GAME_CONFIG).sort()).toEqual(
      ['blades', 'daggerheart', 'fifth', 'pbta', 'root-rpg', 'salvageunion'].sort()
    )
  })

  test('GAME_CONFIG matches AVAILABLE_GAMES from @randsum/games', () => {
    const configKeys = Object.keys(GAME_CONFIG).sort()
    const available = [...AVAILABLE_GAMES].sort()
    expect(configKeys).toEqual(available)
  })

  test('GAME_LIST has all 6 entries', () => {
    expect(GAME_LIST).toHaveLength(6)
  })

  test('each game config has name, color, shortcode, and description', () => {
    for (const config of GAME_LIST) {
      expect(typeof config.name).toBe('string')
      expect(config.name.length).toBeGreaterThan(0)
      expect(typeof config.color).toBe('string')
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(typeof config.shortcode).toBe('string')
      expect(typeof config.description).toBe('string')
    }
  })
})

describe('Game input specs', () => {
  test('GAME_INPUT_SPECS has all 6 games', () => {
    expect(Object.keys(GAME_INPUT_SPECS)).toHaveLength(6)
  })

  test('blades has rating input', () => {
    const specs = GAME_INPUT_SPECS['blades']
    expect(specs).toHaveLength(1)
    expect(specs[0]?.name).toBe('rating')
    expect(specs[0]?.kind).toBe('integer')
    expect(specs[0]?.min).toBe(0)
    expect(specs[0]?.max).toBe(6)
  })

  test('fifth has modifier, rollingWith, and crit inputs', () => {
    const specs = GAME_INPUT_SPECS['fifth']
    expect(specs).toHaveLength(3)
    const names = specs.map(s => s.name)
    expect(names).toContain('modifier')
    expect(names).toContain('rollingWith')
    expect(names).toContain('crit')
  })

  test('salvageunion has tableName string-free input', () => {
    const specs = GAME_INPUT_SPECS['salvageunion']
    expect(specs).toHaveLength(1)
    expect(specs[0]?.name).toBe('tableName')
    expect(specs[0]?.kind).toBe('string-free')
  })

  test('each spec has name, label, and kind', () => {
    for (const [, specs] of Object.entries(GAME_INPUT_SPECS)) {
      for (const spec of specs) {
        expect(typeof spec.name).toBe('string')
        expect(typeof spec.label).toBe('string')
        expect(['integer', 'string-options', 'string-free', 'boolean']).toContain(spec.kind)
      }
    }
  })
})

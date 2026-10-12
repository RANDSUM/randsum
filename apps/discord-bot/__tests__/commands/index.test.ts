import { describe, expect, mock, test } from 'bun:test'
import { specInputs } from './lib/specInputs.js'

void mock.module('@randsum/roller', () => ({
  roll: () => ({ total: 1, result: ['1'], rolls: [] }),
  notation: () => ({}),
  isDiceNotation: () => true,
  validateNotation: () => ({}),
  validateFinite: () => true,
  validateRange: () => true,
  suggestNotationFix: () => undefined
}))

void mock.module('@randsum/roller/roll', () => ({
  roll: () => ({ total: 1, result: ['1'], rolls: [] })
}))

void mock.module('@randsum/roller/validate', () => ({
  notation: () => ({}),
  isDiceNotation: () => true,
  validateNotation: () => ({}),
  validateFinite: () => true,
  validateRange: () => true
}))

void mock.module('@randsum/games/blades', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('blades')
}))
void mock.module('@randsum/games/daggerheart', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('daggerheart')
}))
void mock.module('@randsum/games/fate', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('fate')
}))
void mock.module('@randsum/games/fifth', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('fifth')
}))
void mock.module('@randsum/games/pbta', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('pbta')
}))
void mock.module('@randsum/games/root-rpg', () => ({
  roll: () => ({ total: 1 }),
  inputs: specInputs('root-rpg')
}))

const { commands } = await import('../../src/commands/index.js')

describe('commands barrel', () => {
  test('exports an array of 10 commands', () => {
    expect(Array.isArray(commands)).toBe(true)
    expect(commands).toHaveLength(10)
  })

  test('each command has data and a renderer', () => {
    // `buildView` replaced `buildEmbed`, which replaced `execute`, as the thing
    // every command must have. The Command type requires it; this checks the
    // assembled barrel at runtime as well.
    for (const command of commands) {
      expect(command).toHaveProperty('data')
      expect(command.data).toBeDefined()
      expect(typeof command.buildView).toBe('function')
    }
  })

  test('no command carries a gateway execute handler', () => {
    // The discord.js entry point is gone along with the gateway transport. A
    // command re-growing one would be dead code that reads as live.
    for (const command of commands) {
      expect(command).not.toHaveProperty('execute')
      expect(command).not.toHaveProperty('autocomplete')
    }
  })

  test('command names are unique', () => {
    const names = commands.map(command => command.data.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('every integer option declares explicit bounds', () => {
    // Three commands shipped without them — /blades, /root and /dh — and each
    // let Discord offer a value the game spec rejects, so the player got a raw
    // validator string instead of a roll. Discord will not enforce a range the
    // option does not declare, so declaring one is the only place this can be
    // caught before the roll throws.
    for (const command of commands) {
      for (const option of command.data.options.map(entry => entry.toJSON())) {
        if (option.type !== 4) continue // 4 = INTEGER
        expect(
          { command: command.data.name, option: option.name, min: option.min_value },
          `/${command.data.name} ${option.name} has no minimum`
        ).toHaveProperty('min', expect.any(Number))
        expect(
          { command: command.data.name, option: option.name, max: option.max_value },
          `/${command.data.name} ${option.name} has no maximum`
        ).toHaveProperty('max', expect.any(Number))
      }
    }
  })
})

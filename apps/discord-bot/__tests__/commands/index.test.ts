import { describe, expect, mock, test } from 'bun:test'

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

void mock.module('@randsum/games/blades', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/daggerheart', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/fate', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/fifth', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/pbta', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/root-rpg', () => ({ roll: () => ({ total: 1 }) }))

const { commands } = await import('../../src/commands/index.js')

describe('commands barrel', () => {
  test('exports an array of 10 commands', () => {
    expect(Array.isArray(commands)).toBe(true)
    expect(commands).toHaveLength(10)
  })

  test('each command has data and a buildEmbed renderer', () => {
    // `buildEmbed` replaced `execute` as the thing every command must have.
    // It is optional on the interface so the dispatcher can answer "not
    // available on this deployment" rather than guess — but a command that
    // ships without one is unreachable in production, so the barrel is where
    // that is checked.
    for (const command of commands) {
      expect(command).toHaveProperty('data')
      expect(command.data).toBeDefined()
      expect(typeof command.buildEmbed).toBe('function')
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
})

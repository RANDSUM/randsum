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
void mock.module('@randsum/games/fifth', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/pbta', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/root-rpg', () => ({ roll: () => ({ total: 1 }) }))
void mock.module('@randsum/games/salvageunion', () => ({
  roll: () => ({ total: 1 }),
  VALID_TABLE_NAMES: ['Core Mechanic']
}))

void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => ({}))
}))

const { commands } = await import('../../src/commands/index.js')

describe('commands barrel', () => {
  test('exports an array of 9 commands', () => {
    expect(Array.isArray(commands)).toBe(true)
    expect(commands).toHaveLength(9)
  })

  test('each command has data and execute properties', () => {
    for (const command of commands) {
      expect(command).toHaveProperty('data')
      expect(command).toHaveProperty('execute')
      expect(typeof command.execute).toBe('function')
    }
  })

  test('each command has a data object', () => {
    for (const command of commands) {
      expect(command.data).toBeDefined()
    }
  })
})

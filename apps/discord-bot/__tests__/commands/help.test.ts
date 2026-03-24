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

const { helpCommand } = await import('../../src/commands/help.js')

function makeInteraction(): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined))
  }
}

describe('helpCommand', () => {
  test('has name "help"', () => {
    expect(helpCommand.data.name).toBe('help')
  })

  test('has a description', () => {
    expect(typeof helpCommand.data.description).toBe('string')
    expect(helpCommand.data.description.length).toBeGreaterThan(0)
  })

  test('execute: defers reply', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
  })

  test('execute: replies with an embed', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    )
  })

  test('execute: embed uses gold color', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.color).toBe(0xffd700)
  })

  test('execute: embed includes footer', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { footer?: unknown }
    expect(embedJson.footer).toBeDefined()
  })

  test('execute: embed lists commands via addFields', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: unknown[] }
    expect(embedJson.fields).toBeDefined()
    expect((embedJson.fields ?? []).length).toBeGreaterThan(0)
  })
})

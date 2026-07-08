import { describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'

const { helpCommand } = await import('../../src/commands/help.js')

interface FakeCommand {
  data: { name: string; description: string }
}

function makeCommands(): Map<string, FakeCommand> {
  const entries: FakeCommand[] = [
    { data: { name: 'roll', description: 'Roll dice' } },
    { data: { name: 'blades', description: 'Blades in the Dark' } },
    { data: { name: 'help', description: 'List all available RANDSUM commands' } }
  ]
  return new Map(entries.map(cmd => [cmd.data.name, cmd]))
}

function makeInteraction(hidden = false): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getBoolean: ReturnType<typeof mock> }
  client: { commands: Map<string, FakeCommand> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getBoolean: mock(() => hidden) },
    client: { commands: makeCommands() }
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

  test('exposes a hidden option', () => {
    const json = helpCommand.data.toJSON() as { options?: { name: string }[] }
    const optionNames = (json.options ?? []).map(o => o.name)
    expect(optionNames).toContain('hidden')
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
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.color).toBe(0xffd700)
  })

  test('execute: embed includes footer', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { footer?: unknown }
    expect(embedJson.footer).toBeDefined()
  })

  test('execute: lists commands from the client collection, excluding help itself', async () => {
    const interaction = makeInteraction()
    await helpCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('/roll')
    expect(fieldNames).toContain('/blades')
    expect(fieldNames).not.toContain('/help')
  })
})

import { describe, expect, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'
import { makeContext } from './lib/context.js'

const { helpCommand } = await import('../../src/commands/help.js')

function render(): APIEmbed {
  return helpCommand.buildEmbed!(makeContext()).toJSON()
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

  test('embed uses gold color', () => {
    expect(render().color).toBe(0xffd700)
  })

  test('embed includes footer', () => {
    expect(render().footer).toBeDefined()
  })

  test('lists commands from the barrel, excluding help itself', async () => {
    // Source of truth changed deliberately. `/help` used to read
    // `client.commands`, which only existed on the gateway — the Worker has no
    // client, so the same command could not have rendered there. It reads the
    // command barrel, which `apps/discord-bot/CLAUDE.md` already calls the
    // single source of truth for what commands exist.
    //
    // Importing the barrel is what publishes the registry, so the import below
    // is load-bearing rather than incidental.
    await import('../../src/commands/index.js')

    const fieldNames = (render().fields ?? []).map(field => field.name)
    expect(fieldNames).toContain('/roll')
    expect(fieldNames).toContain('/blades')
    expect(fieldNames).not.toContain('/help')
  })
})

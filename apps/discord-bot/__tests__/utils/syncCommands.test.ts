/**
 * Covers the startup command reconciliation.
 *
 * The load-bearing behaviour is the *comparison*: Discord echoes back fields the
 * bot never declares and fills defaults for ones it omits, so a naive deep-equal
 * would report "changed" on every restart and burn the application's daily
 * command-write budget. These tests pin the normalization against a realistic
 * Discord response, and pin that a sync failure can never propagate.
 */
import { describe, expect, mock, test } from 'bun:test'
import { SlashCommandBuilder } from '../../src/utils/discord.js'
import type { Command } from '../../src/types.js'
import type { RestLike } from '../../src/utils/syncCommands.js'
import { syncCommands } from '../../src/utils/syncCommands.js'

function makeCommand(
  name: string,
  build: (builder: SlashCommandBuilder) => unknown = b => b
): Command {
  const builder = new SlashCommandBuilder().setName(name).setDescription(`${name} description`)
  build(builder)
  return { data: builder, execute: () => Promise.resolve() } as never
}

/**
 * Wrap a local command payload the way the Discord API actually returns it:
 * server-assigned identifiers plus defaults for everything the builder omitted.
 * If normalization regresses, these extras are what breaks it.
 */
function asDiscordResponse(payload: unknown, index: number): Record<string, unknown> {
  const source = payload as Record<string, unknown>
  return {
    ...source,
    id: `100000000000000${index}`,
    application_id: '999999999999999',
    version: `200000000000000${index}`,
    type: 1,
    default_member_permissions: null,
    dm_permission: true,
    contexts: null,
    integration_types: [0],
    nsfw: false,
    guild_id: undefined
  }
}

function remoteFrom(commands: readonly Command[]): Record<string, unknown>[] {
  return commands.map((command, index) => asDiscordResponse(command.data.toJSON(), index))
}

function makeRest(options: {
  readonly remote?: unknown
  readonly getError?: Error
  readonly putError?: Error
}): { rest: RestLike; get: ReturnType<typeof mock>; put: ReturnType<typeof mock> } {
  const get = mock(() =>
    options.getError ? Promise.reject(options.getError) : Promise.resolve(options.remote ?? [])
  )
  const put = mock(() =>
    options.putError ? Promise.reject(options.putError) : Promise.resolve(options.remote ?? [])
  )
  return { rest: { get, put }, get, put }
}

const BASE = { token: 'test-token', clientId: 'client-1' }

describe('syncCommands — no drift', () => {
  test('reports unchanged when Discord already matches the barrel', async () => {
    const commands = [makeCommand('roll'), makeCommand('salvageunion')]
    const { rest } = makeRest({ remote: remoteFrom(commands) })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('unchanged')
  })

  test('does not write when nothing changed', async () => {
    const commands = [makeCommand('roll')]
    const { rest, put } = makeRest({ remote: remoteFrom(commands) })

    await syncCommands({ ...BASE, commands, rest })

    expect(put).not.toHaveBeenCalled()
  })

  test('ignores command ordering differences from Discord', async () => {
    const commands = [makeCommand('roll'), makeCommand('blades')]
    const { rest } = makeRest({ remote: remoteFrom(commands).reverse() })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('unchanged')
  })

  test('survives Discord filling defaults on omitted option fields', async () => {
    const commands = [
      makeCommand('roll', builder =>
        builder.addStringOption(option =>
          option.setName('notation').setDescription('dice notation').setRequired(true)
        )
      )
    ]
    const remote = remoteFrom(commands).map(command => ({
      ...command,
      options: (command['options'] as Record<string, unknown>[]).map(option => ({
        ...option,
        autocomplete: false,
        choices: []
      }))
    }))
    const { rest } = makeRest({ remote })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('unchanged')
  })
})

describe('syncCommands — drift', () => {
  test('writes when a command was renamed', async () => {
    const remote = remoteFrom([makeCommand('su')])
    const commands = [makeCommand('salvageunion')]
    const { rest, put } = makeRest({ remote })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
    expect(put).toHaveBeenCalledTimes(1)
  })

  test('sends the full local barrel as the new registry', async () => {
    const commands = [makeCommand('salvageunion'), makeCommand('roll')]
    const { rest, put } = makeRest({ remote: remoteFrom([makeCommand('su')]) })

    await syncCommands({ ...BASE, commands, rest })

    const body = (put.mock.calls[0]![1] as { body: { name: string }[] }).body
    expect(body.map(entry => entry.name).sort()).toEqual(['roll', 'salvageunion'])
  })

  test('detects a changed option description', async () => {
    const remote = remoteFrom([
      makeCommand('roll', builder =>
        builder.addStringOption(option => option.setName('notation').setDescription('old text'))
      )
    ])
    const commands = [
      makeCommand('roll', builder =>
        builder.addStringOption(option => option.setName('notation').setDescription('new text'))
      )
    ]
    const { rest } = makeRest({ remote })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
  })

  test('treats option order as significant', async () => {
    const remote = remoteFrom([
      makeCommand('roll', builder =>
        builder
          .addStringOption(option => option.setName('alpha').setDescription('a'))
          .addStringOption(option => option.setName('beta').setDescription('b'))
      )
    ])
    const commands = [
      makeCommand('roll', builder =>
        builder
          .addStringOption(option => option.setName('beta').setDescription('b'))
          .addStringOption(option => option.setName('alpha').setDescription('a'))
      )
    ]
    const { rest } = makeRest({ remote })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
  })

  test('registers everything when Discord has no commands yet', async () => {
    const commands = [makeCommand('roll')]
    const { rest, put } = makeRest({ remote: [] })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
    expect(put).toHaveBeenCalledTimes(1)
  })
})

describe('syncCommands — failure is contained', () => {
  test('resolves rather than throwing when the fetch fails', async () => {
    const commands = [makeCommand('roll')]
    const { rest } = makeRest({ getError: new Error('401 Unauthorized') })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('failed')
  })

  test('resolves rather than throwing when the write fails', async () => {
    const commands = [makeCommand('salvageunion')]
    const { rest } = makeRest({
      remote: remoteFrom([makeCommand('su')]),
      putError: new Error('429 Too Many Requests')
    })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('failed')
  })

  test('treats a non-array response as an empty registry instead of crashing', async () => {
    const commands = [makeCommand('roll')]
    const { rest, put } = makeRest({ remote: { message: '401: Unauthorized' } })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
    expect(put).toHaveBeenCalledTimes(1)
  })

  test('normalizes malformed entries in the remote registry without throwing', async () => {
    const commands = [makeCommand('roll')]
    const { rest } = makeRest({
      remote: [null, 'not-a-command', { name: 'roll', options: [null, 'nope'] }]
    })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
  })

  test('normalizes malformed choices without throwing', async () => {
    const commands = [makeCommand('roll')]
    const { rest } = makeRest({
      remote: [{ name: 'roll', options: [{ name: 'mode', type: 3, choices: [null, 42] }] }]
    })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.status).toBe('updated')
  })
})

describe('syncCommands — scope', () => {
  test('reports global scope when no guild is configured', async () => {
    const commands = [makeCommand('roll')]
    const { rest } = makeRest({ remote: remoteFrom(commands) })

    const result = await syncCommands({ ...BASE, commands, rest })

    expect(result.scope).toBe('global')
  })

  test('reports guild scope and targets the guild route when configured', async () => {
    const commands = [makeCommand('roll')]
    const { rest, get } = makeRest({ remote: remoteFrom(commands) })

    const result = await syncCommands({ ...BASE, guildId: 'guild-9', commands, rest })

    expect(result.scope).toBe('guild')
    expect(get.mock.calls[0]![0] as string).toContain('guild-9')
  })

  test('treats an empty guild id as global', async () => {
    const commands = [makeCommand('roll')]
    const { rest } = makeRest({ remote: remoteFrom(commands) })

    const result = await syncCommands({ ...BASE, guildId: '', commands, rest })

    expect(result.scope).toBe('global')
  })
})

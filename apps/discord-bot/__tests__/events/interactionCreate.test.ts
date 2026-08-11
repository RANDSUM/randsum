/**
 * Covers the command-routing branches of interactionCreateHandler, with the
 * unknown-command path as the focus: a stale Discord registry (a command that
 * was renamed or removed but never de-registered) must produce an explicit
 * ephemeral reply rather than a silent timeout, which Discord renders as "The
 * application did not respond".
 */
import { describe, expect, mock, test } from 'bun:test'
import { Collection, MessageFlags } from '../../src/utils/discord.js'
import type { Command } from '../../src/types.js'
import { interactionCreateHandler } from '../../src/events/interactionCreate.js'

interface ReplyPayload {
  readonly content: string
  readonly flags: readonly unknown[]
}

function makeCommand(name: string, execute = mock(() => Promise.resolve())): Command {
  return {
    data: { name, toJSON: () => ({ name }) },
    execute
  } as never
}

function makeInteraction(options: {
  readonly commandName: string
  readonly commands: readonly Command[]
  readonly reply?: ReturnType<typeof mock>
  readonly autocomplete?: boolean
}): {
  interaction: never
  reply: ReturnType<typeof mock>
} {
  const registry = new Collection<string, Command>()
  for (const command of options.commands) {
    registry.set((command.data as { name: string }).name, command)
  }

  const reply = options.reply ?? mock(() => Promise.resolve())

  const interaction = {
    id: 'interaction-1',
    commandName: options.commandName,
    user: { id: 'user-1' },
    guildId: 'guild-1',
    replied: false,
    deferred: false,
    reply,
    followUp: mock(() => Promise.resolve()),
    isAutocomplete: () => options.autocomplete === true,
    isChatInputCommand: () => options.autocomplete !== true,
    client: { commands: registry }
  }

  return { interaction: interaction as never, reply }
}

function firstReplyPayload(reply: ReturnType<typeof mock>): ReplyPayload {
  return reply.mock.calls[0]![0] as ReplyPayload
}

describe('interactionCreateHandler — unknown command', () => {
  test('replies instead of letting the interaction time out', async () => {
    const { interaction, reply } = makeInteraction({
      commandName: 'su',
      commands: [makeCommand('salvageunion')]
    })

    await interactionCreateHandler(interaction)

    expect(reply).toHaveBeenCalledTimes(1)
  })

  test('names the missing command in the reply', async () => {
    const { interaction, reply } = makeInteraction({
      commandName: 'su',
      commands: [makeCommand('salvageunion')]
    })

    await interactionCreateHandler(interaction)

    expect(firstReplyPayload(reply).content).toContain('/su')
  })

  test('replies ephemerally so the channel is not spammed', async () => {
    const { interaction, reply } = makeInteraction({
      commandName: 'su',
      commands: [makeCommand('salvageunion')]
    })

    await interactionCreateHandler(interaction)

    expect(firstReplyPayload(reply).flags).toContain(MessageFlags.Ephemeral)
  })

  test('does not throw when the reply itself fails (expired interaction)', async () => {
    const { interaction } = makeInteraction({
      commandName: 'su',
      commands: [makeCommand('salvageunion')],
      reply: mock(() => Promise.reject(new Error('Unknown interaction')))
    })

    const outcome = await interactionCreateHandler(interaction).then(
      () => 'resolved',
      () => 'rejected'
    )

    expect(outcome).toBe('resolved')
  })
})

describe('interactionCreateHandler — known command', () => {
  test('executes the matching command', async () => {
    const execute = mock(() => Promise.resolve())
    const { interaction } = makeInteraction({
      commandName: 'salvageunion',
      commands: [makeCommand('salvageunion', execute)]
    })

    await interactionCreateHandler(interaction)

    expect(execute).toHaveBeenCalledTimes(1)
  })

  test('does not send the not-found reply', async () => {
    const { interaction, reply } = makeInteraction({
      commandName: 'salvageunion',
      commands: [makeCommand('salvageunion')]
    })

    await interactionCreateHandler(interaction)

    expect(reply).not.toHaveBeenCalled()
  })
})

describe('interactionCreateHandler — autocomplete', () => {
  test('ignores autocomplete for an unregistered command without replying', async () => {
    const { interaction, reply } = makeInteraction({
      commandName: 'su',
      commands: [makeCommand('salvageunion')],
      autocomplete: true
    })

    const outcome = await interactionCreateHandler(interaction).then(
      () => 'resolved',
      () => 'rejected'
    )

    expect(outcome).toBe('resolved')
    expect(reply).not.toHaveBeenCalled()
  })
})

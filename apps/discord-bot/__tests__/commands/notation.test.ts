import { describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: mock(() => {
    return mockEmbed
  }),
  setTitle: mock(() => {
    return mockEmbed
  }),
  setDescription: mock(() => {
    return mockEmbed
  }),
  setFooter: mock(() => {
    return mockEmbed
  }),
  addFields: mock(() => {
    return mockEmbed
  }),
  setURL: mock(() => {
    return mockEmbed
  })
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
  }
}))

const { notationCommand } = await import('../../src/commands/notation.js')

describe('notationCommand', () => {
  test('replies with notation reference embed', async () => {
    const interaction = {
      deferReply: mock(() => Promise.resolve(undefined)),
      editReply: mock(() => Promise.resolve(undefined))
    }
    await notationCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('randsum.dev')
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })
})

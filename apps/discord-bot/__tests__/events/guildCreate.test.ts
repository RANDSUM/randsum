import { describe, expect, mock, test } from 'bun:test'

const mockEmbed = {
  setColor: mock(() => mockEmbed),
  setTitle: mock(() => mockEmbed),
  setDescription: mock(() => mockEmbed),
  setFooter: mock(() => mockEmbed),
  addFields: mock(() => mockEmbed),
  setURL: mock(() => mockEmbed)
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed)
}))

const { guildCreateHandler } = await import('../../src/events/guildCreate.js')

function makeGuild(systemChannelOverride?: null | { send: ReturnType<typeof mock> }): {
  name: string
  systemChannel: null | { send: ReturnType<typeof mock> }
} {
  if (systemChannelOverride === null) {
    return { name: 'Test Guild', systemChannel: null }
  }
  return {
    name: 'Test Guild',
    systemChannel: systemChannelOverride ?? {
      send: mock(() => Promise.resolve(undefined))
    }
  }
}

describe('guildCreateHandler', () => {
  test('sends welcome embed to systemChannel when present', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    expect(guild.systemChannel?.send).toHaveBeenCalledWith(
      expect.objectContaining({ embeds: expect.any(Array) })
    )
  })

  test('does not throw when systemChannel is null', async () => {
    const guild = makeGuild(null)
    const result = await guildCreateHandler(guild as never).then(
      () => 'resolved',
      () => 'rejected'
    )
    expect(result).toBe('resolved')
  })

  test('welcome embed uses purple color', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    expect(mockEmbed.setColor).toHaveBeenCalledWith('#A855F7')
  })

  test('welcome embed includes footer', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    expect(mockEmbed.setFooter).toHaveBeenCalled()
  })

  test('welcome embed includes a link to notation.randsum.dev via setURL or description', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    // Either setURL or setDescription should mention the notation URL
    const urlCalled = mockEmbed.setURL.mock.calls.some(call =>
      String(call[0]).includes('notation.randsum.dev')
    )
    const descCalled = mockEmbed.setDescription.mock.calls.some(call =>
      String(call[0]).includes('notation.randsum.dev')
    )
    expect(urlCalled || descCalled).toBe(true)
  })

  test('welcome embed mentions RANDSUM in title or description', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    const titleCalled = mockEmbed.setTitle.mock.calls.some(call =>
      String(call[0]).toUpperCase().includes('RANDSUM')
    )
    const descCalled = mockEmbed.setDescription.mock.calls.some(call =>
      String(call[0]).toUpperCase().includes('RANDSUM')
    )
    expect(titleCalled || descCalled).toBe(true)
  })
})

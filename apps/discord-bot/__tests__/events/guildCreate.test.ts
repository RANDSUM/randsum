import { describe, expect, mock, test } from 'bun:test'

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

function getEmbedJson(guild: {
  systemChannel: { send: ReturnType<typeof mock> }
}): Record<string, unknown> {
  const sendMock = guild.systemChannel.send
  const call = sendMock.mock.calls[0]![0] as {
    embeds: { toJSON: () => Record<string, unknown> }[]
  }
  return call.embeds[0]!.toJSON()
}

describe('guildCreateHandler', () => {
  test('sends welcome embed to systemChannel when present', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    expect(guild.systemChannel!.send).toHaveBeenCalledWith(
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
    const embedJson = getEmbedJson(guild)
    expect(embedJson.color).toBe(0xa855f7)
  })

  test('welcome embed includes footer', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    const embedJson = getEmbedJson(guild)
    expect(embedJson.footer).toBeDefined()
  })

  test('welcome embed includes a link to notation.randsum.dev via description', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    const embedJson = getEmbedJson(guild)
    expect(embedJson.description as string).toContain('notation.randsum.dev')
  })

  test('welcome embed mentions RANDSUM in title or description', async () => {
    const guild = makeGuild()
    await guildCreateHandler(guild as never)
    const embedJson = getEmbedJson(guild)
    const title = (embedJson.title as string | undefined) ?? ''
    const desc = (embedJson.description as string | undefined) ?? ''
    const titleMatch = title.toUpperCase().includes('RANDSUM')
    const descMatch = desc.toUpperCase().includes('RANDSUM')
    expect(titleMatch || descMatch).toBe(true)
  })
})

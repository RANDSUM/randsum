import { describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'

const { salvageUnionCommand } = await import('../../src/commands/salvageunion.js')

function makeInteraction(): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getBoolean: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getBoolean: mock(() => false) }
  }
}

async function replyEmbed(): Promise<APIEmbed> {
  const interaction = makeInteraction()
  await salvageUnionCommand.execute(interaction as never)
  const call = interaction.editReply.mock.calls[0]?.[0] as {
    embeds: { toJSON: () => APIEmbed }[]
  }
  return call.embeds[0]!.toJSON()
}

describe('salvageUnionCommand', () => {
  test('is registered as /salvageunion, not /su', () => {
    expect(salvageUnionCommand.data.name).toBe('salvageunion')
  })

  test('takes no table option — it no longer rolls', () => {
    const options = salvageUnionCommand.data.toJSON().options ?? []
    expect(options.map(option => option.name)).toEqual(['hidden'])
  })

  test('points at the SURef bot instead of rolling', async () => {
    const embed = await replyEmbed()
    expect(embed.title).toBe('Salvage Union has moved')
    expect(embed.description).toContain('SURef')
  })

  test('includes the SURef invite and info links', async () => {
    const embed = await replyEmbed()
    const fieldValues = (embed.fields ?? []).map(field => field.value).join('\n')
    expect(fieldValues).toContain('client_id=1442878052823470172')
    expect(fieldValues).toContain('https://salvageunion.io/discord')
  })
})

import { beforeEach, describe, expect, mock, test } from 'bun:test'
import type { APIEmbed } from 'discord.js'

const mockRoll = mock(
  (): { total: number; result: number; rolls: unknown[]; details: unknown } => ({
    total: 15,
    result: 15,
    rolls: [{ initialRolls: [15], rolls: [15], modifierLogs: [] }],
    details: { criticals: undefined }
  })
)

void mock.module('@randsum/games/fifth', () => ({ roll: mockRoll }))

const { fifthCommand } = await import('../../src/commands/fifth.js')

function makeInteraction(
  modifier: number | null = 0,
  rollingWith: string | null = null
): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: {
    getInteger: ReturnType<typeof mock>
    getString: ReturnType<typeof mock>
    getBoolean: ReturnType<typeof mock>
  }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: {
      getInteger: mock(() => modifier),
      getString: mock(() => rollingWith),
      getBoolean: mock(() => false)
    }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('fifthCommand', () => {
  test('normal roll uses blue color', async () => {
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.color).toBe(0x1e90ff)
    expect(embedJson.title).toBe('D&D 5e Roll: 15')
  })

  test('passes crit: true in the roll call', async () => {
    const interaction = makeInteraction(3)
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({ modifier: 3, crit: true })
  })

  test('passes crit: true with rollingWith advantage', async () => {
    const interaction = makeInteraction(2, 'Advantage')
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 2,
      crit: true,
      rollingWith: 'Advantage'
    })
  })

  test('passes crit: true with rollingWith disadvantage', async () => {
    const interaction = makeInteraction(0, 'Disadvantage')
    await fifthCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith({
      modifier: 0,
      crit: true,
      rollingWith: 'Disadvantage'
    })
  })

  test('natural 20 uses gold color and "Natural 20!" prefix', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 20,
      result: 20,
      rolls: [{ initialRolls: [20], rolls: [20], modifierLogs: [] }],
      details: { criticals: { isNatural20: true, isNatural1: false } }
    }))
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.color).toBe(0xffd700)
    expect(embedJson.title).toBe('Natural 20! D&D 5e Roll: 20')
  })

  test('natural 1 uses crimson color and "Natural 1!" prefix', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 1,
      result: 1,
      rolls: [{ initialRolls: [1], rolls: [1], modifierLogs: [] }],
      details: { criticals: { isNatural20: false, isNatural1: true } }
    }))
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.color).toBe(0xdc143c)
    expect(embedJson.title).toBe('Natural 1! D&D 5e Roll: 1')
  })

  test('advantage tie: kept die bold, dropped die struck (not both bold)', async () => {
    // Both d20s show 4. The roller keeps one (rolls: [4]); the display must
    // bold exactly one die and strike the other, never bold both.
    mockRoll.mockImplementationOnce(() => ({
      total: 4,
      result: 4,
      rolls: [{ initialRolls: [4, 4], rolls: [4], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const interaction = makeInteraction(0, 'Advantage')
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    const diceField = embedJson.fields?.find(f => f.name === 'Dice Rolled (2d20)')
    expect(diceField?.value).toBe('**4**, ~~4~~')
  })

  test('disadvantage tie: kept die bold, dropped die struck (not both bold)', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 17,
      result: 17,
      rolls: [{ initialRolls: [17, 17], rolls: [17], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const interaction = makeInteraction(0, 'Disadvantage')
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    const diceField = embedJson.fields?.find(f => f.name === 'Dice Rolled (2d20)')
    expect(diceField?.value).toBe('**17**, ~~17~~')
  })

  test('advantage non-tie: higher kept bold, lower struck', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 18,
      result: 18,
      rolls: [{ initialRolls: [18, 5], rolls: [18], modifierLogs: [] }],
      details: { criticals: undefined }
    }))
    const interaction = makeInteraction(0, 'Advantage')
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    const diceField = embedJson.fields?.find(f => f.name === 'Dice Rolled (2d20)')
    expect(diceField?.value).toBe('**18**, ~~5~~')
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction()
    await fifthCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => APIEmbed }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockRoll = mock(() => ({
  result: 'success' as const,
  total: 5,
  rolls: [{ initialRolls: [5, 3], rolls: [5], modifierLogs: [] }]
}))

void mock.module('@randsum/games/blades', () => ({ roll: mockRoll }))

const { bladesCommand } = await import('../../src/commands/blades.js')

function makeInteraction(dice: number): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getInteger: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getInteger: mock(() => dice) }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('bladesCommand', () => {
  test('success result', async () => {
    const interaction = makeInteraction(3)
    await bladesCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Success!')
  })

  test('critical result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical' as const,
      total: 6,
      rolls: [{ initialRolls: [6, 6], rolls: [6, 6], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(2)
    await bladesCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Critical Success!')
  })

  test('partial result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'partial' as const,
      total: 4,
      rolls: [{ initialRolls: [4, 3], rolls: [4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(2)
    await bladesCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Partial Success')
  })

  test('failure result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 1], rolls: [2], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(1)
    await bladesCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Failure')
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction(3)
    await bladesCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

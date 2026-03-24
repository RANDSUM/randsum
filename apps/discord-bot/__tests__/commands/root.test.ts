import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockRoll = mock(() => ({
  result: 'Strong Hit' as const,
  total: 9,
  rolls: [{ initialRolls: [5, 4], rolls: [5, 4], modifierLogs: [] }]
}))

void mock.module('@randsum/games/root-rpg', () => ({ roll: mockRoll }))

const { rootCommand } = await import('../../src/commands/root.js')

function makeInteraction(modifier: number | null = null): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getInteger: ReturnType<typeof mock> }
  member: { user: { username: string } }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getInteger: mock(() => modifier) },
    member: { user: { username: 'Tester' } }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
})

describe('rootCommand', () => {
  test('Strong Hit', async () => {
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Tester rolled a Strong Hit')
  })

  test('Weak Hit', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'Weak Hit' as const,
      total: 7,
      rolls: [{ initialRolls: [4, 3], rolls: [4, 3], modifierLogs: [] }]
    }))
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Tester rolled a Weak Hit')
  })

  test('Miss', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'Miss' as const,
      total: 3,
      rolls: [{ initialRolls: [2, 1], rolls: [2, 1], modifierLogs: [] }]
    }))
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Tester rolled a Miss')
  })

  test('non-zero modifier adds modifier field', async () => {
    const interaction = makeInteraction(2)
    await rootCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Modifier')
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

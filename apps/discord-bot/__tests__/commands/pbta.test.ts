import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockCollector = {
  on: mock(() => mockCollector)
}

const mockRow = {}
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => mockRow)
}))

const mockRoll = mock(() => ({
  result: 'strong_hit' as const,
  total: 10,
  rolls: [{ initialRolls: [5, 5], rolls: [5, 5], modifierLogs: [] }]
}))

void mock.module('@randsum/games/pbta', () => ({ roll: mockRoll }))

const { pbtaCommand } = await import('../../src/commands/pbta.js')

function makeInteraction(
  opts: {
    stat?: number
    forward?: number
    ongoing?: number
    rollingWith?: string | null
  } = {}
): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: {
    getInteger: ReturnType<typeof mock>
    getString: ReturnType<typeof mock>
  }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() =>
      Promise.resolve({ createMessageComponentCollector: mock(() => mockCollector) })
    ),
    options: {
      getInteger: mock((name: string) => {
        if (name === 'stat') return opts.stat ?? 2
        if (name === 'forward') return opts.forward ?? 0
        if (name === 'ongoing') return opts.ongoing ?? 0
        return 0
      }),
      getString: mock((_name: string) => opts.rollingWith ?? null)
    }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
})

describe('pbtaCommand', () => {
  test('strong hit', async () => {
    const interaction = makeInteraction({ stat: 2 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Strong Hit!')
  })

  test('weak hit', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'weak_hit' as const,
      total: 8,
      rolls: [{ initialRolls: [4, 4], rolls: [4, 4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ stat: 1 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Weak Hit')
  })

  test('miss', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'miss' as const,
      total: 4,
      rolls: [{ initialRolls: [2, 2], rolls: [2, 2], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ stat: -1 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Miss')
  })

  test('non-zero forward adds forward field', async () => {
    const interaction = makeInteraction({ stat: 2, forward: 1 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Forward')
  })

  test('non-zero ongoing adds ongoing field', async () => {
    const interaction = makeInteraction({ stat: 2, ongoing: 2 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Ongoing')
  })

  test('rollingWith adds rolling_with field', async () => {
    const interaction = makeInteraction({ stat: 2, rollingWith: 'Advantage' })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Rolling With')
  })

  test('reply includes re-roll button component', async () => {
    const interaction = makeInteraction({ stat: 2 })
    await pbtaCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) })
    )
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction({ stat: 2 })
    await pbtaCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

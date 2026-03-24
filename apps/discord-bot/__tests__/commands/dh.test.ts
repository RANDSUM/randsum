import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockCollector = {
  on: mock(() => mockCollector)
}

const mockRow = {}
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => mockRow)
}))

const mockRoll = mock(() => ({
  result: 'hope' as const,
  total: 14,
  details: { hope: { roll: 8 }, fear: { roll: 6 }, extraDie: undefined, modifier: 0 },
  rolls: []
}))

void mock.module('@randsum/games/daggerheart', () => ({ roll: mockRoll }))

const { dhCommand } = await import('../../src/commands/dh.js')

function makeInteraction(
  opts: {
    modifier?: number
    rollingWith?: string | null
    amplifyHope?: boolean
    amplifyFear?: boolean
  } = {}
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
    editReply: mock(() =>
      Promise.resolve({ createMessageComponentCollector: mock(() => mockCollector) })
    ),
    options: {
      getInteger: mock((_name: string) => opts.modifier ?? 0),
      getString: mock((_name: string) => opts.rollingWith ?? null),
      getBoolean: mock((name: string) => {
        if (name === 'amplify_hope') return opts.amplifyHope ?? false
        if (name === 'amplify_fear') return opts.amplifyFear ?? false
        return false
      })
    }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
})

describe('dhCommand', () => {
  test('hope result', async () => {
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Hope!')
  })

  test('fear result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'fear' as const,
      total: 10,
      details: { hope: { roll: 4 }, fear: { roll: 8 }, extraDie: undefined, modifier: 0 },
      rolls: []
    }))
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Fear!')
  })

  test('critical hope result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical hope' as const,
      total: 20,
      details: { hope: { roll: 10 }, fear: { roll: 10 }, extraDie: undefined, modifier: 0 },
      rolls: []
    }))
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Critical Hope!')
  })

  test('with advantage and extraDie shows extra die fields', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'hope' as const,
      total: 18,
      details: {
        hope: { roll: 8 },
        fear: { roll: 6 },
        extraDie: { roll: 4, advantageRoll: 4, disadvantageRoll: undefined },
        modifier: 0
      },
      rolls: []
    }))
    const interaction = makeInteraction({ rollingWith: 'Advantage' })
    await dhCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Advantage Die (d6)')
  })

  test('with modifier adds modifier field', async () => {
    const interaction = makeInteraction({ modifier: 3 })
    await dhCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON() as { fields?: { name: string }[] }
    const fieldNames = (embedJson.fields ?? []).map(f => f.name)
    expect(fieldNames).toContain('Modifier')
  })

  test('reply includes re-roll button component', async () => {
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) })
    )
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

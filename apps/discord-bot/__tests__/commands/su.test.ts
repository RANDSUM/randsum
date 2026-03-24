import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockCollector = {
  on: mock(() => mockCollector)
}

const mockRow = {}
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => mockRow)
}))

const mockRoll = mock(() => ({
  total: 15,
  result: {
    roll: 15,
    label: 'Success',
    description: 'You succeed',
    tableName: 'Core Mechanic',
    key: '11-19',
    table: {}
  },
  rolls: []
}))

void mock.module('@randsum/games/salvageunion', () => ({
  roll: mockRoll,
  VALID_TABLE_NAMES: ['Core Mechanic', 'Morale']
}))

const { suCommand } = await import('../../src/commands/su.js')

function makeInteraction(table: string | null = null): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getString: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() =>
      Promise.resolve({ createMessageComponentCollector: mock(() => mockCollector) })
    ),
    options: { getString: mock(() => table) }
  }
}

beforeEach(() => {
  mockRoll.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
})

describe('suCommand', () => {
  test('no table defaults to Core Mechanic', async () => {
    const interaction = makeInteraction(null)
    await suCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith('Core Mechanic')
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('explicit table is passed to roll', async () => {
    const interaction = makeInteraction('Morale')
    await suCommand.execute(interaction as never)
    expect(mockRoll).toHaveBeenCalledWith('Morale')
  })

  test('embed title matches result label', async () => {
    const interaction = makeInteraction(null)
    await suCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Success')
  })

  test('reply includes re-roll button component', async () => {
    const interaction = makeInteraction(null)
    await suCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) })
    )
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction(null)
    await suCommand.execute(interaction as never)
    const call = interaction.editReply.mock.calls[0]?.[0] as {
      embeds: { toJSON: () => Record<string, unknown> }[]
    }
    const embedJson = call.embeds[0]!.toJSON()
    expect(embedJson.title).toBe('Error')
  })
})

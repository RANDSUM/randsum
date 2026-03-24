import { beforeEach, describe, expect, mock, test } from 'bun:test'

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
  setThumbnail: mock(() => {
    return mockEmbed
  })
}

class OptionBuilder {
  public setName(): this {
    return this
  }
  public setDescription(): this {
    return this
  }
  public setRequired(): this {
    return this
  }
  public setMinValue(): this {
    return this
  }
  public setMaxValue(): this {
    return this
  }
}

const mockCollector = {
  on: mock(() => mockCollector)
}

void mock.module('../../src/utils/discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  StringSelectMenuBuilder: mock(() => ({})),
  ActionRowBuilder: mock(() => ({ addComponents: () => ({}) })),
  ButtonBuilder: mock(() => ({
    setCustomId: () => ({}),
    setLabel: () => ({}),
    setStyle: () => ({}),
    setDisabled: () => ({})
  })),
  ButtonStyle: { Secondary: 2 },
  ComponentType: { StringSelect: 3, Button: 2 },
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
    public addIntegerOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
  }
}))

const mockRow = {}
void mock.module('../../src/utils/rollButton.js', () => ({
  createRollButton: mock(() => mockRow)
}))

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
    editReply: mock(() =>
      Promise.resolve({ createMessageComponentCollector: mock(() => mockCollector) })
    ),
    options: { getInteger: mock(() => modifier) },
    member: { user: { username: 'Tester' } }
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockRoll.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
})

describe('rootCommand', () => {
  test('Strong Hit', async () => {
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Tester rolled a Strong Hit')
  })

  test('Weak Hit', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'Weak Hit' as const,
      total: 7,
      rolls: [{ initialRolls: [4, 3], rolls: [4, 3], modifierLogs: [] }]
    }))
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Tester rolled a Weak Hit')
  })

  test('Miss', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'Miss' as const,
      total: 3,
      rolls: [{ initialRolls: [2, 1], rolls: [2, 1], modifierLogs: [] }]
    }))
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Tester rolled a Miss')
  })

  test('non-zero modifier adds modifier field', async () => {
    const interaction = makeInteraction(2)
    await rootCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('reply includes re-roll button component', async () => {
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({ components: expect.any(Array) })
    )
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction()
    await rootCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] })
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Error')
  })
})

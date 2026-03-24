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
  public addChoices(): this {
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
    public addStringOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addBooleanOption(fn: (o: OptionBuilder) => unknown): this {
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
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockRoll.mockClear()
  for (const fn of Object.values(mockCollector)) fn.mockClear()
})

describe('dhCommand', () => {
  test('hope result', async () => {
    const interaction = makeInteraction()
    await dhCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Hope!')
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
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Fear!')
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
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Critical Hope!')
  })

  test('with advantage and extraDie shows extra die fields', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'hope' as const,
      total: 18,
      details: { hope: { roll: 8 }, fear: { roll: 6 }, extraDie: { roll: 4 }, modifier: 0 },
      rolls: []
    }))
    const interaction = makeInteraction({ rollingWith: 'Advantage' })
    await dhCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })

  test('with modifier adds modifier field', async () => {
    const interaction = makeInteraction({ modifier: 3 })
    await dhCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
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
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] })
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Error')
  })
})

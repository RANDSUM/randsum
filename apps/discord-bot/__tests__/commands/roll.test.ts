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
  }),
  setURL: mock(() => {
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
  public addChoices(): this {
    return this
  }
}

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  SlashCommandBuilder: class {
    public setName(): this {
      return this
    }
    public setDescription(): this {
      return this
    }
    public addStringOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addIntegerOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
    public addBooleanOption(fn: (o: OptionBuilder) => unknown): this {
      fn(new OptionBuilder())
      return this
    }
  }
}))

const mockNotation = mock(() => '1d20')
const mockRoll = mock(() => ({
  total: 15,
  rolls: [{ initialRolls: [8, 7], rolls: [8, 7], modifierLogs: [] }]
}))

void mock.module('@randsum/roller', () => ({
  notation: mockNotation,
  roll: mockRoll
}))

const { rollCommand } = await import('../../src/commands/roll.js')

function makeInteraction(opts: Record<string, string | null> = {}): {
  deferReply: ReturnType<typeof mock>
  editReply: ReturnType<typeof mock>
  options: { getString: ReturnType<typeof mock> }
} {
  return {
    deferReply: mock(() => Promise.resolve(undefined)),
    editReply: mock(() => Promise.resolve(undefined)),
    options: { getString: mock((name: string) => opts[name] ?? null) }
  }
}

beforeEach(() => {
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockNotation.mockClear()
  mockRoll.mockClear()
})

describe('rollCommand', () => {
  test('happy path: valid notation calls roll and replies with embed', async () => {
    const interaction = makeInteraction({ notation: '2d6' })
    await rollCommand.execute(interaction as never)
    expect(interaction.deferReply).toHaveBeenCalledTimes(1)
    expect(mockRoll).toHaveBeenCalledTimes(1)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('You rolled a 15')
  })

  test('invalid notation: replyWithError called, roll not called', async () => {
    mockNotation.mockImplementationOnce(() => {
      throw new Error('Invalid')
    })
    const interaction = makeInteraction({ notation: 'garbage' })
    await rollCommand.execute(interaction as never)
    expect(mockRoll).not.toHaveBeenCalled()
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('roll throws: replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Roll failed')
    })
    const interaction = makeInteraction({ notation: '1d20' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('modified rolls same as initial: no Modified Rolls field added', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 5,
      rolls: [{ initialRolls: [5], rolls: [5], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '1d6' })
    await rollCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
  })

  test('modified rolls differ from initial: Modified Rolls field added', async () => {
    mockRoll.mockImplementationOnce(() => ({
      total: 7,
      rolls: [{ initialRolls: [3, 4], rolls: [4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction({ notation: '2d6L' })
    await rollCommand.execute(interaction as never)
    expect(mockEmbed.addFields).toHaveBeenCalled()
  })
})

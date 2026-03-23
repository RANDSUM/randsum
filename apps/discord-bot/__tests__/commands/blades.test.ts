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

void mock.module('discord.js', () => ({
  EmbedBuilder: mock(() => mockEmbed),
  StringSelectMenuBuilder: mock(() => ({})),
  ActionRowBuilder: mock(() => ({ addComponents: () => ({}) })),
  ComponentType: { StringSelect: 3 },
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
  for (const fn of Object.values(mockEmbed)) fn.mockClear()
  mockRoll.mockClear()
})

describe('bladesCommand', () => {
  test('success result', async () => {
    const interaction = makeInteraction(3)
    await bladesCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Success!')
  })

  test('critical result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'critical' as const,
      total: 6,
      rolls: [{ initialRolls: [6, 6], rolls: [6, 6], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(2)
    await bladesCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Critical Success!')
  })

  test('partial result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'partial' as const,
      total: 4,
      rolls: [{ initialRolls: [4, 3], rolls: [4], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(2)
    await bladesCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Partial Success')
  })

  test('failure result', async () => {
    mockRoll.mockImplementationOnce(() => ({
      result: 'failure' as const,
      total: 2,
      rolls: [{ initialRolls: [2, 1], rolls: [2], modifierLogs: [] }]
    }))
    const interaction = makeInteraction(1)
    await bladesCommand.execute(interaction as never)
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Failure')
  })

  test('error path: roll throws, replies with error embed', async () => {
    mockRoll.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    const interaction = makeInteraction(3)
    await bladesCommand.execute(interaction as never)
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] })
    expect(mockEmbed.setTitle).toHaveBeenCalledWith('Error')
  })
})
